-- Migration: Fix notifications target_type to include push_enabled
-- Date: 2025-01-19
-- Description: Add push_enabled as valid target_type option

-- Alterar a constraint do target_type para incluir 'push_enabled'
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_target_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_target_type_check 
CHECK (target_type IN ('all', 'specific', 'push_enabled'));

-- Atualizar a função create_notification para suportar push_enabled
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
  v_push_subscription_count INTEGER;
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
  
  -- Verificar se existem usuários com push notifications ativadas quando target_type é push_enabled
  IF p_target_type = 'push_enabled' THEN
    SELECT COUNT(*) INTO v_push_subscription_count
    FROM public.user_push_subscriptions
    WHERE is_active = true;
    
    IF v_push_subscription_count = 0 THEN
      RAISE NOTICE 'Nenhum usuário com notificações push ativadas encontrado';
    END IF;
  END IF;
  
  -- Inserir notificação
  INSERT INTO public.notifications (
    title, message, type, target_type, target_user_id, created_by, expires_at
  ) VALUES (
    p_title, p_message, p_type, p_target_type, p_target_user_id, auth.uid(), p_expires_at
  ) RETURNING id INTO v_notification_id;
  
  -- Se for push_enabled, enviar notificações push para usuários com subscriptions ativas
  IF p_target_type = 'push_enabled' THEN
    -- Aqui poderia ser implementada a lógica de envio de push notifications
    -- Por enquanto, apenas registramos a notificação
    RAISE NOTICE 'Notificação criada para usuários com push notifications ativadas: %', v_notification_id;
  END IF;
  
  RETURN v_notification_id;
END;
$$;

-- Atualizar a política de visualização para incluir push_enabled
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;

CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (
      target_type = 'all' 
      OR (target_type = 'specific' AND target_user_id = auth.uid())
      OR (
        target_type = 'push_enabled' 
        AND EXISTS (
          SELECT 1 FROM public.user_push_subscriptions 
          WHERE user_id = auth.uid() AND is_active = true
        )
      )
    )
  );

-- Comentário atualizado
COMMENT ON FUNCTION create_notification IS 'Função para criar notificações (apenas admins) - suporta all, specific e push_enabled';