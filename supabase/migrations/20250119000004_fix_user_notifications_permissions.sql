-- Corrigir permissões para tabela user_notifications
-- Date: 2025-01-19
-- Description: Garantir que as permissões estejam corretas para visualização das notificações

-- Verificar se a tabela user_notifications existe, se não, criar
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

-- Habilitar RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Admins can update all notifications" ON user_notifications;

-- Criar políticas RLS
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

CREATE POLICY "System can insert notifications" ON user_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all notifications" ON user_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Conceder permissões
GRANT SELECT ON user_notifications TO anon;
GRANT SELECT ON user_notifications TO authenticated;
GRANT INSERT ON user_notifications TO authenticated;
GRANT UPDATE ON user_notifications TO authenticated;

-- Verificar dados existentes e criar alguns registros de teste se necessário
DO $$
DECLARE
    notification_count INTEGER;
    user_notification_count INTEGER;
    test_notification_id UUID;
    admin_user_id UUID;
BEGIN
    SELECT COUNT(*) INTO notification_count FROM public.notifications;
    SELECT COUNT(*) INTO user_notification_count FROM public.user_notifications;
    
    RAISE NOTICE 'Total de notificações: %, Total de user_notifications: %', notification_count, user_notification_count;
    
    -- Se não há registros em user_notifications mas há notificações, criar registros
    IF user_notification_count = 0 AND notification_count > 0 THEN
        RAISE NOTICE 'Criando registros em user_notifications para notificações existentes...';
        
        -- Para cada notificação existente, criar registros na user_notifications
        INSERT INTO user_notifications (user_id, notification_id, sent_at, delivery_status)
        SELECT 
            up.id as user_id,
            n.id as notification_id,
            n.created_at as sent_at,
            'sent' as delivery_status
        FROM notifications n
        CROSS JOIN user_profiles up
        WHERE n.target_type = 'all'
        AND n.is_active = true
        ON CONFLICT (user_id, notification_id) DO NOTHING;
        
        -- Para notificações específicas
        INSERT INTO user_notifications (user_id, notification_id, sent_at, delivery_status)
        SELECT 
            n.target_user_id as user_id,
            n.id as notification_id,
            n.created_at as sent_at,
            'sent' as delivery_status
        FROM notifications n
        WHERE n.target_type = 'specific'
        AND n.target_user_id IS NOT NULL
        AND n.is_active = true
        ON CONFLICT (user_id, notification_id) DO NOTHING;
        
        GET DIAGNOSTICS user_notification_count = ROW_COUNT;
        RAISE NOTICE 'Criados % registros em user_notifications', user_notification_count;
    END IF;
END $$;