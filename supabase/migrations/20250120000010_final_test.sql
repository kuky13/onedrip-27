-- Teste final para verificar se as notificações estão funcionando
-- Date: 2025-01-20
-- Description: Teste completo do sistema de notificações

DO $$
DECLARE
    test_user_id UUID;
    notification_count INTEGER;
    user_notification_count INTEGER;
    function_result_count INTEGER;
BEGIN
    -- Pegar o primeiro usuário
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE '=== TESTE FINAL DE NOTIFICAÇÕES ===';
        RAISE NOTICE 'Usuário de teste: %', test_user_id;
        
        -- 1. Verificar notificações na tabela
        SELECT COUNT(*) INTO notification_count FROM notifications WHERE is_active = true;
        RAISE NOTICE '1. Notificações ativas na tabela: %', notification_count;
        
        -- 2. Verificar user_notifications para este usuário
        SELECT COUNT(*) INTO user_notification_count 
        FROM user_notifications 
        WHERE user_id = test_user_id AND user_deleted_at IS NULL;
        RAISE NOTICE '2. User_notifications para este usuário (não deletadas): %', user_notification_count;
        
        -- 3. Simular autenticação e testar função
        PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
        
        SELECT COUNT(*) INTO function_result_count FROM get_user_notifications(50, 0);
        RAISE NOTICE '3. Resultado da função get_user_notifications: %', function_result_count;
        
        -- 4. Se não há resultados, vamos criar uma notificação de teste específica
        IF function_result_count = 0 THEN
            RAISE NOTICE '4. Nenhuma notificação encontrada. Criando notificação de teste...';
            
            -- Inserir notificação de teste
            INSERT INTO notifications (title, message, type, target_type, created_by, is_active)
            VALUES ('Teste Final', 'Esta é uma notificação de teste final', 'info', 'all', test_user_id, true);
            
            -- Testar novamente
            SELECT COUNT(*) INTO function_result_count FROM get_user_notifications(50, 0);
            RAISE NOTICE '4. Após criar notificação de teste: %', function_result_count;
        END IF;
        
        RAISE NOTICE '=== FIM DO TESTE ===';
    ELSE
        RAISE NOTICE 'ERRO: Nenhum usuário encontrado no sistema!';
    END IF;
END $$;