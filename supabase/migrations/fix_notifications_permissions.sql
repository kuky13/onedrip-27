-- Fix notifications permissions
-- Check and grant proper permissions for notifications tables

-- Grant permissions to anon and authenticated roles for notifications table
GRANT SELECT ON public.notifications TO anon;
GRANT ALL PRIVILEGES ON public.notifications TO authenticated;

-- Grant permissions to anon and authenticated roles for user_notifications_read table
GRANT SELECT ON public.user_notifications_read TO anon;
GRANT ALL PRIVILEGES ON public.user_notifications_read TO authenticated;

-- Grant permissions to anon and authenticated roles for user_notifications table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_notifications' AND table_schema = 'public') THEN
        GRANT SELECT ON public.user_notifications TO anon;
        GRANT ALL PRIVILEGES ON public.user_notifications TO authenticated;
    END IF;
END $$;

-- Grant execute permissions on RPC functions with specific signatures
GRANT EXECUTE ON FUNCTION get_user_notifications(INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_user_notifications(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_as_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(VARCHAR, TEXT, VARCHAR, VARCHAR, UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Create some test notifications if none exist
DO $$
DECLARE
    notification_count INTEGER;
    admin_user_id UUID;
BEGIN
    -- Check if there are any notifications
    SELECT COUNT(*) INTO notification_count FROM public.notifications;
    
    -- Get first admin user
    SELECT id INTO admin_user_id 
    FROM public.user_profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    -- If no notifications exist and we have an admin user, create test notifications
    IF notification_count = 0 AND admin_user_id IS NOT NULL THEN
        -- Create test notification for all users
        INSERT INTO public.notifications (
            title, 
            message, 
            type, 
            target_type, 
            created_by
        ) VALUES (
            'Bem-vindo ao Sistema!', 
            'Esta é uma notificação de teste para todos os usuários. O sistema de notificações está funcionando corretamente.', 
            'info', 
            'all', 
            admin_user_id
        );
        
        -- Create test notification for specific user (admin)
        INSERT INTO public.notifications (
            title, 
            message, 
            type, 
            target_type, 
            target_user_id,
            created_by
        ) VALUES (
            'Notificação Admin', 
            'Esta é uma notificação específica para administradores.', 
            'warning', 
            'specific', 
            admin_user_id,
            admin_user_id
        );
        
        RAISE NOTICE 'Notificações de teste criadas com sucesso!';
    ELSE
        RAISE NOTICE 'Já existem % notificações no sistema', notification_count;
    END IF;
END $$;

-- Check current permissions
SELECT 
    'Permissions for ' || grantee || ' on ' || table_name || ': ' || privilege_type as permission_info
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND grantee IN ('anon', 'authenticated') 
    AND table_name LIKE '%notification%'
ORDER BY table_name, grantee;