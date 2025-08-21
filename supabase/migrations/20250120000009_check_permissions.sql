-- Verificar e corrigir permissões das tabelas
-- Date: 2025-01-20
-- Description: Garantir que as permissões estejam corretas para anon e authenticated

-- Verificar permissões atuais
DO $$
BEGIN
    RAISE NOTICE 'Verificando permissões atuais...';
END $$;

SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
AND table_name IN ('notifications', 'user_notifications')
ORDER BY table_name, grantee;

-- Garantir permissões para a tabela notifications
GRANT SELECT ON notifications TO anon;
GRANT SELECT ON notifications TO authenticated;

-- Garantir permissões para a tabela user_notifications
GRANT SELECT ON user_notifications TO anon;
GRANT ALL PRIVILEGES ON user_notifications TO authenticated;

-- Garantir permissões para a função get_user_notifications
GRANT EXECUTE ON FUNCTION get_user_notifications(INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_user_notifications(INTEGER, INTEGER) TO authenticated;

-- Verificar permissões após as alterações
DO $$
BEGIN
    RAISE NOTICE 'Permissões atualizadas!';
END $$;

SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
AND table_name IN ('notifications', 'user_notifications')
ORDER BY table_name, grantee;