-- Teste da função mark_notification_as_read

-- Verificar se a função existe
SELECT proname, proargnames, prosrc 
FROM pg_proc 
WHERE proname = 'mark_notification_as_read';

-- Verificar se há notificações de teste
SELECT COUNT(*) as total_notifications FROM public.notifications;
SELECT COUNT(*) as total_user_notifications FROM public.user_notifications;
SELECT COUNT(*) as total_read_records FROM public.user_notifications_read;

-- Criar uma notificação de teste se não existir
DO $$
DECLARE
    test_notification_id UUID;
    test_user_id UUID;
BEGIN
    -- Buscar um usuário existente
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Criar notificação de teste
        INSERT INTO public.notifications (title, message, type, target_type, created_by)
        VALUES ('Teste de Marcação', 'Esta é uma notificação de teste para verificar a função mark_as_read', 'info', 'all', test_user_id)
        RETURNING id INTO test_notification_id;
        
        -- Criar registro na user_notifications
        INSERT INTO public.user_notifications (user_id, notification_id, sent_at, delivery_status)
        VALUES (test_user_id, test_notification_id, NOW(), 'sent')
        ON CONFLICT (user_id, notification_id) DO NOTHING;
        
        RAISE NOTICE 'Notificação de teste criada: %', test_notification_id;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado para teste';
    END IF;
END $$;

-- Verificar dados após criação
SELECT 
    n.id as notification_id,
    n.title,
    un.user_id,
    un.delivery_status,
    unr.read_at,
    unr.is_deleted
FROM public.notifications n
LEFT JOIN public.user_notifications un ON n.id = un.notification_id
LEFT JOIN public.user_notifications_read unr ON n.id = unr.notification_id AND un.user_id = unr.user_id
WHERE n.title = 'Teste de Marcação'
ORDER BY n.created_at DESC
LIMIT 5;