-- Verificar e corrigir permissões da tabela service_orders
-- Date: 2025-01-20
-- Description: Verificar permissões para operações de delete na tabela service_orders

-- Verificar permissões atuais
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'service_orders'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Garantir que a role authenticated tenha todas as permissões necessárias
GRANT ALL PRIVILEGES ON service_orders TO authenticated;

-- Garantir que a role anon tenha pelo menos permissão de leitura
GRANT SELECT ON service_orders TO anon;

-- Verificar se as funções RPC existem
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('soft_delete_service_order', 'restore_service_order', 'hard_delete_service_order')
ORDER BY routine_name;

-- Comentário sobre as permissões
COMMENT ON TABLE service_orders IS 'Tabela de ordens de serviço com permissões para authenticated role';