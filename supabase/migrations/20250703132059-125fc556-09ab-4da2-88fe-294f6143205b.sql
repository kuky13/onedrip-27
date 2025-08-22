-- FASE 1: Remoção de Tabelas Redundantes/Vazias

-- 1. Remover tabela 'profiles' (duplicata vazia de user_profiles)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Remover tabela 'user_activity_metrics' (nunca implementada, 0 registros)
DROP TABLE IF EXISTS public.user_activity_metrics CASCADE;

-- 3. Remover tabela 'admin_audit_log' (duplicata vazia de admin_logs)
DROP TABLE IF EXISTS public.admin_audit_log CASCADE;

-- 4. Remover tabela 'admin_users' (sistema não utilizado)
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- FASE 2: Remoção de Funções Obsoletas

-- Remover funções de hard delete substituídas por soft delete
DROP FUNCTION IF EXISTS public.delete_budget_with_parts(uuid);
DROP FUNCTION IF EXISTS public.delete_all_user_budgets();

-- Remover funções vazias não implementadas
DROP FUNCTION IF EXISTS public.is_user_expired();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.budgets_search_trigger();

-- Remover trigger obsoleto de user_activity_metrics
DROP TRIGGER IF EXISTS update_user_activity_metrics ON auth.users;
DROP FUNCTION IF EXISTS public.update_user_activity_metrics();

-- Remover função de cleanup não utilizada
DROP FUNCTION IF EXISTS public.cleanup_expired_users();

-- Limpeza de políticas RLS órfãs das tabelas removidas
-- (As políticas são automaticamente removidas com DROP TABLE CASCADE)

-- Otimização: Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_budgets_owner_deleted ON public.budgets(owner_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_budget_parts_budget_deleted ON public.budget_parts(budget_id, deleted_at) WHERE deleted_at IS NULL;

-- Comentários para documentação
COMMENT ON TABLE public.budgets IS 'Tabela principal de orçamentos com soft delete implementado';
COMMENT ON TABLE public.budget_parts IS 'Partes/componentes dos orçamentos';
COMMENT ON TABLE public.budget_deletion_audit IS 'Auditoria de exclusões para possível restauração';
COMMENT ON TABLE public.admin_logs IS 'Logs unificados de ações administrativas';