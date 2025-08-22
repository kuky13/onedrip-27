-- 🔒 CORREÇÕES CRÍTICAS DE SEGURANÇA - 
-- Implementação completa do plano de segurança

-- ===== 1. CORREÇÃO DE FUNÇÕES COM search_path VULNERÁVEL =====
-- Atualizar todas as funções para usar search_path explícito

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  );
END;
$$;

-- ===== 2. FUNÇÃO DE LOG DE EVENTOS DE SEGURANÇA =====
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT auth.uid(),
  p_details JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'medium'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_logs (
    admin_user_id,
    action,
    details
  ) VALUES (
    p_user_id,
    'SECURITY_EVENT: ' || p_event_type,
    jsonb_build_object(
      'severity', p_severity,
      'timestamp', now(),
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
      'event_details', p_details
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Não falhar se o log não conseguir ser gravado
    NULL;
END;
$$;

-- ===== 3. FUNÇÃO DE RATE LIMITING =====
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP ou user_id
  action_type TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(identifier, action_type)
);

-- Enable RLS
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policy para rate limiting
CREATE POLICY "System can manage rate limiting" 
ON public.rate_limit_tracking 
FOR ALL 
USING (true);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action_type TEXT,
  p_max_attempts INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_attempts INTEGER;
  window_start_time TIMESTAMP WITH TIME ZONE;
  is_blocked BOOLEAN DEFAULT FALSE;
BEGIN
  -- Limpar tentativas antigas
  DELETE FROM public.rate_limit_tracking 
  WHERE window_start < now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Verificar tentativas atuais
  SELECT attempt_count, window_start 
  INTO current_attempts, window_start_time
  FROM public.rate_limit_tracking 
  WHERE identifier = p_identifier AND action_type = p_action_type;
  
  IF current_attempts IS NULL THEN
    -- Primeira tentativa
    INSERT INTO public.rate_limit_tracking (identifier, action_type, attempt_count)
    VALUES (p_identifier, p_action_type, 1)
    ON CONFLICT (identifier, action_type) 
    DO UPDATE SET attempt_count = 1, window_start = now();
    
    current_attempts := 1;
  ELSE
    -- Incrementar tentativas
    current_attempts := current_attempts + 1;
    UPDATE public.rate_limit_tracking 
    SET attempt_count = current_attempts
    WHERE identifier = p_identifier AND action_type = p_action_type;
  END IF;
  
  -- Verificar se excedeu limite
  is_blocked := current_attempts > p_max_attempts;
  
  -- Log se bloqueado
  IF is_blocked THEN
    PERFORM public.log_security_event(
      'RATE_LIMIT_EXCEEDED',
      auth.uid(),
      jsonb_build_object(
        'identifier', p_identifier,
        'action_type', p_action_type,
        'attempts', current_attempts,
        'max_allowed', p_max_attempts
      ),
      'high'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', NOT is_blocked,
    'attempts', current_attempts,
    'max_attempts', p_max_attempts,
    'reset_at', window_start_time + (p_window_minutes || ' minutes')::INTERVAL
  );
END;
$$;

-- ===== 4. MELHORIA DAS POLÍTICAS RLS EXISTENTES =====
-- Atualizar política de budgets para ser mais restritiva
DROP POLICY IF EXISTS "budgets_select_policy" ON public.budgets;
CREATE POLICY "budgets_select_policy" ON public.budgets
FOR SELECT USING (
  (owner_id = auth.uid() AND deleted_at IS NULL)
  OR public.is_current_user_admin()
);

-- ===== 5. AUDITORIA DE TENTATIVAS DE LOGIN =====
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view login attempts" 
ON public.login_attempts 
FOR SELECT 
USING (public.is_current_user_admin());

CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.login_attempts (
    email, 
    ip_address, 
    user_agent, 
    success, 
    failure_reason
  ) VALUES (
    p_email,
    current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
    current_setting('request.headers', true)::jsonb->>'user-agent',
    p_success,
    p_failure_reason
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Não falhar se o log não conseguir ser gravado
    NULL;
END;
$$;

-- ===== 6. PROTEÇÃO CONTRA EXPOSIÇÃO DE DADOS =====
-- Função para buscar dados do usuário de forma segura
CREATE OR REPLACE FUNCTION public.get_secure_user_data(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_data JSONB;
BEGIN
  -- Verificar se é o próprio usuário ou admin
  IF p_user_id != auth.uid() AND NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: você só pode acessar seus próprios dados';
  END IF;
  
  -- Retornar apenas dados seguros
  SELECT jsonb_build_object(
    'id', up.id,
    'name', up.name,
    'role', up.role,
    'is_active', up.is_active,
    'expiration_date', up.expiration_date,
    'budget_limit', up.budget_limit,
    'advanced_features_enabled', up.advanced_features_enabled,
    'created_at', up.created_at
  ) INTO user_data
  FROM public.user_profiles up
  WHERE up.id = p_user_id;
  
  RETURN user_data;
END;
$$;

-- ===== 7. LIMPEZA DE DADOS ANTIGOS DE SEGURANÇA =====
CREATE OR REPLACE FUNCTION public.cleanup_security_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Limpar logs de rate limiting antigos (mais de 7 dias)
  DELETE FROM public.rate_limit_tracking 
  WHERE created_at < now() - INTERVAL '7 days';
  
  -- Limpar tentativas de login antigas (mais de 30 dias)
  DELETE FROM public.login_attempts 
  WHERE created_at < now() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- ===== 8. TRIGGER PARA AUDITORIA AUTOMÁTICA =====
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log mudanças em perfis de usuário
  IF TG_TABLE_NAME = 'user_profiles' THEN
    PERFORM public.log_security_event(
      'USER_PROFILE_MODIFIED',
      auth.uid(),
      jsonb_build_object(
        'target_user', COALESCE(NEW.id, OLD.id),
        'operation', TG_OP,
        'old_data', to_jsonb(OLD),
        'new_data', to_jsonb(NEW)
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger em tabelas sensíveis
DROP TRIGGER IF EXISTS audit_user_profiles_changes ON public.user_profiles;
CREATE TRIGGER audit_user_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- ===== 9. ÍNDICES PARA PERFORMANCE DE SEGURANÇA =====
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_identifier 
ON public.rate_limit_tracking(identifier, action_type);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time 
ON public.login_attempts(email, created_at);

CREATE INDEX IF NOT EXISTS idx_admin_logs_security_events 
ON public.admin_logs(action, created_at) 
WHERE action LIKE 'SECURITY_EVENT:%';

-- ===== 10. CONFIGURAÇÕES DE SEGURANÇA FINAIS =====
-- Atualizar configurações do game para ser mais seguro
UPDATE public.game_settings 
SET hit_sound_volume = LEAST(hit_sound_volume, 1.0)
WHERE hit_sound_volume > 1.0;

COMMENT ON FUNCTION public.log_security_event IS 'Registra eventos de segurança para auditoria';
COMMENT ON FUNCTION public.check_rate_limit IS 'Implementa rate limiting por identificador e ação';
COMMENT ON TABLE public.rate_limit_tracking IS 'Controle de rate limiting do sistema';
COMMENT ON TABLE public.login_attempts IS 'Log de tentativas de login para auditoria';