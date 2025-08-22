-- Verificar dados nas tabelas
DO $$
DECLARE
    notification_count INTEGER;
    user_notification_count INTEGER;
    user_count INTEGER;
    rec RECORD;
BEGIN
    -- Contar notificações
    SELECT COUNT(*) INTO notification_count FROM notifications;
    RAISE NOTICE 'Total de notificações: %', notification_count;
    
    -- Contar user_notifications
    SELECT COUNT(*) INTO user_notification_count FROM user_notifications;
    RAISE NOTICE 'Total de user_notifications: %', user_notification_count;
    
    -- Contar usuários
    SELECT COUNT(*) INTO user_count FROM auth.users;
    RAISE NOTICE 'Total de usuários: %', user_count;
    
    -- Mostrar algumas notificações
    RAISE NOTICE 'Notificações existentes:';
    FOR rec IN SELECT id, title, type, target_type, is_active FROM notifications LIMIT 5 LOOP
        RAISE NOTICE 'ID: %, Título: %, Tipo: %, Target: %, Ativa: %', rec.id, rec.title, rec.type, rec.target_type, rec.is_active;
    END LOOP;
END $$;