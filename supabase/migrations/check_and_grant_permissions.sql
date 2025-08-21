-- Verificar e configurar permissões para as tabelas de configuração

-- Conceder permissões para a tabela service_types
GRANT SELECT, INSERT, UPDATE, DELETE ON service_types TO authenticated;
GRANT SELECT ON service_types TO anon;

-- Conceder permissões para a tabela custom_statuses
GRANT SELECT, INSERT, UPDATE, DELETE ON custom_statuses TO authenticated;
GRANT SELECT ON custom_statuses TO anon;

-- Conceder permissões para a tabela whatsapp_settings
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_settings TO authenticated;
GRANT SELECT ON whatsapp_settings TO anon;

-- Conceder permissões para a tabela company_info
GRANT SELECT, INSERT, UPDATE, DELETE ON company_info TO authenticated;
GRANT SELECT ON company_info TO anon;

-- Conceder permissões para a tabela company_share_settings
GRANT SELECT, INSERT, UPDATE, DELETE ON company_share_settings TO authenticated;
GRANT SELECT ON company_share_settings TO anon;

-- Verificar permissões atuais
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND grantee IN ('anon', 'authenticated') 
  AND table_name IN ('service_types', 'custom_statuses', 'whatsapp_settings', 'company_info', 'company_share_settings') 
ORDER BY table_name, grantee;