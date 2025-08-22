-- Criar tabela de notificações personalizadas
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('all', 'specific')),
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para rastrear notificações lidas pelos usuários
CREATE TABLE IF NOT EXISTS public.user_notifications_read (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON public.notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON public.notifications(created_by);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_active ON public.notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON public.notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read_user ON public.user_notifications_read(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read_notification ON public.user_notifications_read(notification_id);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications_read ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para notifications
-- Admins podem ver e gerenciar todas as notificações
CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Usuários podem ver notificações direcionadas a eles ou públicas
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (
      target_type = 'all' 
      OR (target_type = 'specific' AND target_user_id = auth.uid())
    )
  );

-- Políticas de segurança para user_notifications_read
-- Usuários podem gerenciar apenas seus próprios registros de leitura
CREATE POLICY "Users can manage their own read status" ON public.user_notifications_read
  FOR ALL USING (user_id = auth.uid());

-- Admins podem ver todos os registros de leitura
CREATE POLICY "Admins can view all read status" ON public.user_notifications_read
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Função para criar notificação (apenas admins)
CREATE OR REPLACE FUNCTION create_notification(
  p_title VARCHAR(255),
  p_message TEXT,
  p_type VARCHAR(20),
  p_target_type VARCHAR(20),
  p_target_user_id UUID DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
  v_user_role TEXT;
BEGIN
  -- Verificar se o usuário é admin
  SELECT role INTO v_user_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem criar notificações';
  END IF;
  
  -- Validar parâmetros
  IF p_target_type = 'specific' AND p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'target_user_id é obrigatório quando target_type é specific';
  END IF;
  
  -- Inserir notificação
  INSERT INTO public.notifications (
    title, message, type, target_type, target_user_id, created_by, expires_at
  ) VALUES (
    p_title, p_message, p_type, p_target_type, p_target_user_id, auth.uid(), p_expires_at
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION mark_notification_as_read(
  p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir ou atualizar registro de leitura
  INSERT INTO public.user_notifications_read (notification_id, user_id)
  VALUES (p_notification_id, auth.uid())
  ON CONFLICT (notification_id, user_id) DO UPDATE SET
    read_at = NOW();
  
  RETURN TRUE;
END;
$$;

-- Função para obter notificações do usuário
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.type,
    n.created_at,
    n.expires_at,
    (unr.id IS NOT NULL) as is_read
  FROM public.notifications n
  LEFT JOIN public.user_notifications_read unr ON n.id = unr.notification_id AND unr.user_id = auth.uid()
  WHERE 
    n.is_active = true
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    AND (
      n.target_type = 'all' 
      OR (n.target_type = 'specific' AND n.target_user_id = auth.uid())
    )
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications TO authenticated;

-- Comentários
COMMENT ON TABLE public.notifications IS 'Tabela para armazenar notificações personalizadas do sistema';
COMMENT ON TABLE public.user_notifications_read IS 'Tabela para rastrear quais notificações foram lidas por cada usuário';
COMMENT ON FUNCTION create_notification IS 'Função para criar notificações (apenas admins)';
COMMENT ON FUNCTION mark_notification_as_read IS 'Função para marcar notificação como lida';
COMMENT ON FUNCTION get_user_notifications IS 'Função para obter notificações do usuário atual';