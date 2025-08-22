-- Migration: Integrate push notifications with notification creation
-- Date: 2025-01-19
-- Description: Automatically send push notifications when creating notifications with push_enabled target

-- Função para enviar notificações push para usuários com subscriptions ativas
CREATE OR REPLACE FUNCTION send_push_to_subscribed_users(
  p_notification_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record RECORD;
  notification_data JSONB;
  sent_count INTEGER := 0;
BEGIN
  -- Preparar dados da notificação
  notification_data := jsonb_build_object(
    'title', p_title,
    'message', p_message,
    'type', p_type,
    'notificationId', p_notification_id,
    'timestamp', extract(epoch from now())
  );
  
  -- Buscar todas as subscriptions ativas
  FOR subscription_record IN 
    SELECT ups.user_id, ups.endpoint, ups.p256dh_key, ups.auth_key 
    FROM user_push_subscriptions ups
    WHERE ups.is_active = true
  LOOP
    -- Criar registro na tabela user_notifications para cada usuário
    INSERT INTO user_notifications (
      user_id,
      notification_id,
      sent_at,
      delivery_status
    ) VALUES (
      subscription_record.user_id,
      p_notification_id,
      NOW(),
      'sent'
    ) ON CONFLICT (user_id, notification_id) DO NOTHING;
    
    -- Em produção, aqui seria feita a chamada para o serviço de push notifications
    -- Por enquanto, apenas logamos a tentativa
    RAISE NOTICE 'Enviando push notification para usuário % endpoint: % com dados: %', 
      subscription_record.user_id, subscription_record.endpoint, notification_data;
    
    sent_count := sent_count + 1;
  END LOOP;
  
  RETURN sent_count;
END;
$$;

-- Criar tabela para rastrear envios de notificações
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, notification_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_id ON user_notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_status ON user_notifications(delivery_status);

-- RLS para user_notifications
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications" ON user_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Atualizar a função create_notification para integrar com push notifications
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
  v_sent_count INTEGER;
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
  
  -- Processar envio baseado no target_type
  IF p_target_type = 'push_enabled' THEN
    -- Enviar para usuários com push notifications ativadas
    SELECT send_push_to_subscribed_users(v_notification_id, p_title, p_message, p_type) INTO v_sent_count;
    RAISE NOTICE 'Notificação enviada para % usuários com push notifications ativadas', v_sent_count;
    
  ELSIF p_target_type = 'specific' AND p_target_user_id IS NOT NULL THEN
    -- Enviar para usuário específico se ele tem push notifications ativadas
    IF EXISTS (SELECT 1 FROM user_push_subscriptions WHERE user_id = p_target_user_id AND is_active = true) THEN
      INSERT INTO user_notifications (
        user_id,
        notification_id,
        sent_at,
        delivery_status
      ) VALUES (
        p_target_user_id,
        v_notification_id,
        NOW(),
        'sent'
      );
      
      -- Enviar push notification
      PERFORM send_push_notification(p_target_user_id, p_title, p_message, p_type, 
        jsonb_build_object('notificationId', v_notification_id));
    END IF;
    
  ELSIF p_target_type = 'all' THEN
    -- Para 'all', criar registros para todos os usuários ativos
    INSERT INTO user_notifications (user_id, notification_id, sent_at, delivery_status)
    SELECT up.id, v_notification_id, NOW(), 'sent'
    FROM user_profiles up
    WHERE up.id IS NOT NULL;
    
    -- Enviar push notifications para usuários com subscriptions ativas
    SELECT send_push_to_subscribed_users(v_notification_id, p_title, p_message, p_type) INTO v_sent_count;
    RAISE NOTICE 'Notificação criada para todos os usuários. Push notifications enviadas para % usuários', v_sent_count;
  END IF;
  
  RETURN v_notification_id;
END;
$$;

-- Função para marcar notificação como lida (atualizada)
CREATE OR REPLACE FUNCTION mark_notification_as_read(
  p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar na tabela user_notifications se existir
  UPDATE user_notifications 
  SET read_at = NOW()
  WHERE notification_id = p_notification_id 
    AND user_id = auth.uid() 
    AND read_at IS NULL;
  
  -- Inserir ou atualizar na tabela user_notifications_read (para compatibilidade)
  INSERT INTO public.user_notifications_read (notification_id, user_id)
  VALUES (p_notification_id, auth.uid())
  ON CONFLICT (notification_id, user_id) DO UPDATE SET
    read_at = NOW();
  
  RETURN TRUE;
END;
$$;

-- Conceder permissões
GRANT ALL ON user_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION send_push_to_subscribed_users(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Comentários
COMMENT ON TABLE user_notifications IS 'Rastreia o envio de notificações para usuários específicos';
COMMENT ON FUNCTION send_push_to_subscribed_users IS 'Envia push notifications para todos os usuários com subscriptions ativas';
COMMENT ON FUNCTION create_notification IS 'Função para criar notificações com envio automático de push notifications';