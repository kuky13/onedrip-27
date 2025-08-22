SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND grantee IN ('anon', 'authenticated') 
  AND table_name IN ('service_types', 'custom_statuses', 'whatsapp_settings', 'company_info', 'company_share_settings') 
ORDER BY table_name, grantee;