-- Garantir que as notificações de teste estejam associadas aos usuários
DO $$
DECLARE
    test_user_id UUID;
    notification_rec RECORD;
BEGIN
    -- Pegar o primeiro usuário disponível
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Usuário encontrado: %', test_user_id;
        
        -- Para cada notificação de teste, garantir que existe um registro em user_notifications
        FOR notification_rec IN SELECT id FROM notifications WHERE title LIKE 'Teste%' LOOP
            -- Verificar se já existe
            IF NOT EXISTS (
                SELECT 1 FROM user_notifications 
                WHERE user_id = test_user_id AND notification_id = notification_rec.id
            ) THEN
                -- Inserir se não existir
                INSERT INTO user_notifications (user_id, notification_id, delivery_status)
                VALUES (test_user_id, notification_rec.id, 'delivered');
                RAISE NOTICE 'Criado user_notification para notificação: %', notification_rec.id;
            ELSE
                RAISE NOTICE 'user_notification já existe para notificação: %', notification_rec.id;
            END IF;
        END LOOP;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado!';
    END IF;
END $$;