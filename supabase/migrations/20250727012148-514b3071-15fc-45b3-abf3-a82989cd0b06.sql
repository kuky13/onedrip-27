-- Remoção das funções relacionadas a CSV import/export

-- 1. Remover função de verificação de integridade de dados para exportação
DROP FUNCTION IF EXISTS public.verify_budget_data_integrity();

-- 2. Remover função de correção de dados para exportação  
DROP FUNCTION IF EXISTS public.fix_budget_data_for_export();

-- 3. Remover função de estatísticas de exportação
DROP FUNCTION IF EXISTS public.get_budget_export_stats();

-- Log da limpeza
COMMENT ON SCHEMA public IS 'CSV import/export functions removed for future implementation';