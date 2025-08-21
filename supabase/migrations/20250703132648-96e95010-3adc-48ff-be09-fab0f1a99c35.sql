-- LIMPEZA FINAL: Remover apenas componentes sem dependências problemáticas

-- Remover tabelas redundantes/vazias
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_activity_metrics CASCADE;
DROP TABLE IF EXISTS public.admin_audit_log CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- Remover funções de hard delete substituídas por soft delete
DROP FUNCTION IF EXISTS public.delete_budget_with_parts(uuid);
DROP FUNCTION IF EXISTS public.delete_all_user_budgets();

-- Remover funções vazias não implementadas
DROP FUNCTION IF EXISTS public.is_user_expired();
DROP FUNCTION IF EXISTS public.is_admin();

-- Remover função de cleanup não utilizada
DROP FUNCTION IF EXISTS public.cleanup_expired_users();

-- Remover funções de admin obsoletas
DROP FUNCTION IF EXISTS public.admin_log_audit_action(uuid, text, jsonb);

-- Remover triggers de busca não utilizados
DROP TRIGGER IF EXISTS budgets_search_update ON public.budgets;
DROP TRIGGER IF EXISTS budgets_search_vector_update ON public.budgets;
DROP FUNCTION IF EXISTS public.budgets_search_trigger();

-- Otimização: Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_budgets_owner_deleted ON public.budgets(owner_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_budget_parts_budget_deleted ON public.budget_parts(budget_id, deleted_at) WHERE deleted_at IS NULL;

-- Limpeza de políticas RLS redundantes
DROP POLICY IF EXISTS "Admin can do everything with user_profiles" ON public.user_profiles;

-- Comentários para documentação
COMMENT ON TABLE public.budgets IS 'Tabela principal de orçamentos com soft delete implementado';
COMMENT ON TABLE public.budget_parts IS 'Partes/componentes dos orçamentos';
COMMENT ON TABLE public.budget_deletion_audit IS 'Auditoria de exclusões para possível restauração';
COMMENT ON TABLE public.admin_logs IS 'Logs unificados de ações administrativas';

-- Estatísticas finais da limpeza
DO $$
BEGIN
    RAISE NOTICE 'Limpeza do Supabase concluída: 4 tabelas removidas, 7+ funções removidas, índices otimizados';
END $$;