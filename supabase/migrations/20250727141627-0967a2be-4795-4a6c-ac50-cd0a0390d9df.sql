-- ========================================
-- CORREÇÃO E ANÁLISE COMPLETA DO SUPABASE 
-- Para garantir login persistente e segurança
-- ========================================

-- 1. CRIAR TABELA DE MÉTRICAS DE ATIVIDADE FALTANTE
-- Corrige erro: "relation "public.user_activity_metrics" does not exist"
CREATE TABLE IF NOT EXISTS public.user_activity_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para user_activity_metrics
ALTER TABLE public.user_activity_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity metrics" ON public.user_activity_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity metrics" ON public.user_activity_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity metrics" ON public.user_activity_metrics
  FOR ALL USING (is_current_user_admin());

-- 2. CRIAR TABELA DE SESSÕES PERSISTENTES
-- Para melhor controle de login persistente
CREATE TABLE IF NOT EXISTS public.persistent_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  user_agent TEXT,
  ip_address TEXT,
  is_trusted BOOLEAN NOT NULL DEFAULT false,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

-- RLS para persistent_sessions
ALTER TABLE public.persistent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions" ON public.persistent_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON public.persistent_sessions
  FOR SELECT USING (is_current_user_admin());

-- 3. FUNÇÃO PARA GERENCIAR SESSÕES PERSISTENTES
CREATE OR REPLACE FUNCTION public.manage_persistent_session(
  p_device_fingerprint TEXT,
  p_device_name TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_session_record RECORD;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;

  -- Buscar sessão existente
  SELECT * INTO v_session_record
  FROM public.persistent_sessions
  WHERE user_id = v_user_id 
  AND device_fingerprint = p_device_fingerprint;

  IF v_session_record IS NULL THEN
    -- Criar nova sessão
    INSERT INTO public.persistent_sessions (
      user_id, device_fingerprint, device_name, device_type, 
      user_agent, ip_address, is_trusted
    ) VALUES (
      v_user_id, p_device_fingerprint, p_device_name, p_device_type,
      p_user_agent, p_ip_address, false
    )
    RETURNING * INTO v_session_record;
    
    v_result := jsonb_build_object(
      'success', true,
      'action', 'created',
      'session_id', v_session_record.id,
      'is_trusted', v_session_record.is_trusted
    );
  ELSE
    -- Atualizar sessão existente
    UPDATE public.persistent_sessions
    SET 
      last_activity = now(),
      user_agent = COALESCE(p_user_agent, user_agent),
      ip_address = COALESCE(p_ip_address, ip_address),
      updated_at = now()
    WHERE id = v_session_record.id
    RETURNING * INTO v_session_record;
    
    v_result := jsonb_build_object(
      'success', true,
      'action', 'updated',
      'session_id', v_session_record.id,
      'is_trusted', v_session_record.is_trusted
    );
  END IF;

  -- Registrar métrica de atividade
  INSERT INTO public.user_activity_metrics (user_id, metric_type, metric_value, metadata)
  VALUES (
    v_user_id, 
    'session_activity', 
    1,
    jsonb_build_object(
      'device_fingerprint', p_device_fingerprint,
      'action', CASE WHEN v_session_record.created_at = v_session_record.updated_at THEN 'new_session' ELSE 'session_update' END
    )
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4. FUNÇÃO PARA MARCAR DISPOSITIVO COMO CONFIÁVEL (CORRIGIDA)
CREATE OR REPLACE FUNCTION public.trust_device(p_device_fingerprint TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_rows_affected INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;

  UPDATE public.persistent_sessions
  SET 
    is_trusted = true,
    updated_at = now()
  WHERE user_id = v_user_id 
  AND device_fingerprint = p_device_fingerprint;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  IF v_rows_affected > 0 THEN
    -- Registrar métrica
    INSERT INTO public.user_activity_metrics (user_id, metric_type, metric_value, metadata)
    VALUES (
      v_user_id, 
      'device_trusted', 
      1,
      jsonb_build_object('device_fingerprint', p_device_fingerprint)
    );
    
    RETURN jsonb_build_object('success', true, 'message', 'Dispositivo marcado como confiável');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Sessão não encontrada');
  END IF;
END;
$$;

-- 5. FUNÇÃO PARA VERIFICAR SE DEVE MANTER LOGIN
CREATE OR REPLACE FUNCTION public.should_maintain_login(p_device_fingerprint TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_session RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('should_maintain', false, 'reason', 'not_authenticated');
  END IF;

  SELECT * INTO v_session
  FROM public.persistent_sessions
  WHERE user_id = v_user_id 
  AND device_fingerprint = p_device_fingerprint
  AND expires_at > now();

  IF v_session IS NULL THEN
    RETURN jsonb_build_object('should_maintain', false, 'reason', 'no_valid_session');
  END IF;

  -- Verificar se dispositivo é confiável e sessão é recente
  IF v_session.is_trusted AND v_session.last_activity > (now() - INTERVAL '30 days') THEN
    -- Atualizar última atividade
    UPDATE public.persistent_sessions
    SET last_activity = now(), updated_at = now()
    WHERE id = v_session.id;
    
    RETURN jsonb_build_object(
      'should_maintain', true,
      'reason', 'trusted_device',
      'session_id', v_session.id,
      'expires_at', v_session.expires_at
    );
  ELSE
    RETURN jsonb_build_object(
      'should_maintain', false, 
      'reason', 'device_not_trusted_or_expired',
      'is_trusted', v_session.is_trusted,
      'last_activity', v_session.last_activity
    );
  END IF;
END;
$$;

-- 6. FUNÇÃO DE LIMPEZA DE SESSÕES EXPIRADAS
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Deletar sessões expiradas há mais de 7 dias
  DELETE FROM public.persistent_sessions
  WHERE expires_at < (now() - INTERVAL '7 days');
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Deletar métricas antigas (mais de 90 dias)
  DELETE FROM public.user_activity_metrics
  WHERE recorded_at < (now() - INTERVAL '90 days');
  
  RETURN v_deleted_count;
END;
$$;

-- 7. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_persistent_sessions_user_device 
  ON public.persistent_sessions(user_id, device_fingerprint);

CREATE INDEX IF NOT EXISTS idx_persistent_sessions_expires_at 
  ON public.persistent_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_activity_metrics_user_type 
  ON public.user_activity_metrics(user_id, metric_type);

CREATE INDEX IF NOT EXISTS idx_user_activity_metrics_recorded_at 
  ON public.user_activity_metrics(recorded_at);

-- 8. GRANT NECESSÁRIOS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_activity_metrics TO authenticated;
GRANT ALL ON public.persistent_sessions TO authenticated;

-- Finalização
SELECT 'Migração básica completa: Tabelas e funções criadas para login persistente' as status;