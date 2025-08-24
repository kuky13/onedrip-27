-- Conceder permissões para as tabelas PIX

-- Permissões para usuários autenticados na tabela pix_transactions
GRANT SELECT, INSERT, UPDATE ON pix_transactions TO authenticated;

-- Permissões para usuários autenticados na tabela transaction_logs
GRANT SELECT, INSERT ON transaction_logs TO authenticated;

-- Permissões para usuários anônimos (apenas leitura limitada se necessário)
-- Por segurança, não concedemos permissões para anon nas tabelas PIX
-- pois transações devem ser feitas apenas por usuários autenticados

-- Verificar se as permissões foram aplicadas
-- Esta query pode ser executada para verificar:
-- SELECT grantee, table_name, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('pix_transactions', 'transaction_logs') 
-- AND grantee IN ('anon', 'authenticated') 
-- ORDER BY table_name, grantee;