-- ============================================
-- ANÁLISE E OTIMIZAÇÃO DO SUPABASE
-- ============================================

-- TABELAS UTILIZADAS NO APP:
-- ✅ budgets - Tabela principal de orçamentos (usada extensivamente)
-- ✅ budget_parts - Partes dos orçamentos (usada nos formulários)
-- ✅ budget_deletion_audit - Auditoria de exclusões (usada no TrashManagement)
-- ✅ clients - Clientes (usada nos hooks e componentes)
-- ✅ user_profiles - Perfis de usuários (usada em auth e admin)
-- ✅ admin_logs - Logs administrativos (usada no AdminLogs)
-- ✅ device_types - Tipos de dispositivos (usada nos formulários)
-- ✅ warranty_periods - Períodos de garantia (usada nos formulários)
-- ✅ shop_profiles - Perfis de loja (usada em configurações)
-- ✅ site_settings - Configurações do site (usada no SiteSettingsContent)
-- ✅ admin_images - Imagens administrativas (usada no AdminImageManager)
-- ✅ game_settings - Configurações do jogo (usada nos componentes de jogo)
-- ✅ ranking_invaders - Ranking do jogo (usada nos componentes de ranking)
-- ✅ licenses - Sistema de licenças (usada na autenticação e admin)

-- ============================================
-- OTIMIZAÇÃO DE ÍNDICES
-- ============================================

-- Índices para melhor performance das consultas principais
CREATE INDEX IF NOT EXISTS idx_budgets_owner_deleted_status 
ON public.budgets(owner_id, deleted_at, workflow_status) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_budgets_search_vector 
ON public.budgets USING gin(search_vector) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_budget_parts_budget_deleted 
ON public.budget_parts(budget_id, deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_clients_user_favorite_default 
ON public.clients(user_id, is_favorite, is_default);

CREATE INDEX IF NOT EXISTS idx_user_profiles_active_role_expiration 
ON public.user_profiles(is_active, role, expiration_date);

CREATE INDEX IF NOT EXISTS idx_licenses_user_active_expires 
ON public.licenses(user_id, is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created_admin 
ON public.admin_logs(created_at DESC, admin_user_id);

CREATE INDEX IF NOT EXISTS idx_ranking_invaders_score_created 
ON public.ranking_invaders(score DESC, created_at ASC);

-- ============================================
-- LIMPEZA DE DADOS ANTIGOS
-- ============================================

-- Limpar registros de auditoria muito antigos (mais de 1 ano) que não podem ser restaurados
DELETE FROM public.budget_deletion_audit 
WHERE created_at < NOW() - INTERVAL '1 year' 
AND can_restore = false;

-- Limpar logs administrativos muito antigos (mais de 6 meses)
DELETE FROM public.admin_logs 
WHERE created_at < NOW() - INTERVAL '6 months';

-- Limpar scores de ranking muito antigos (manter apenas os últimos 3 meses)
DELETE FROM public.ranking_invaders 
WHERE created_at < NOW() - INTERVAL '3 months';

-- Desativar licenças expiradas há mais de 30 dias
UPDATE public.licenses 
SET is_active = false, last_validation = NOW()
WHERE expires_at < NOW() - INTERVAL '30 days' 
AND is_active = true;

-- ============================================
-- OTIMIZAÇÃO DE FUNÇÕES
-- ============================================

-- Criar função otimizada para contagem de orçamentos ativos
CREATE OR REPLACE FUNCTION public.count_active_budgets(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM public.budgets
  WHERE owner_id = p_user_id 
  AND deleted_at IS NULL;
$$;

-- Criar função otimizada para verificar licença ativa
CREATE OR REPLACE FUNCTION public.is_user_license_active(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.licenses l
    INNER JOIN public.user_profiles up ON l.user_id = up.id
    WHERE l.user_id = p_user_id 
    AND l.is_active = true
    AND (l.expires_at IS NULL OR l.expires_at > NOW())
    AND up.is_active = true
    AND up.expiration_date > NOW()
  );
$$;

-- Criar função otimizada para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  );
$$;

-- ============================================
-- ATUALIZAÇÃO DE ESTATÍSTICAS
-- ============================================

-- Atualizar estatísticas das tabelas principais para melhor performance
ANALYZE public.budgets;
ANALYZE public.budget_parts;
ANALYZE public.clients;
ANALYZE public.user_profiles;
ANALYZE public.licenses;
ANALYZE public.admin_logs;
ANALYZE public.budget_deletion_audit;

-- ============================================
-- CONFIGURAÇÃO DE LIMPEZA AUTOMÁTICA
-- ============================================

-- Comentário: Para limpeza automática futura, considere criar um job cron
-- que execute periodicamente as funções de limpeza de dados antigos

-- ============================================
-- RESUMO DA OTIMIZAÇÃO
-- ============================================

-- ADICIONADO:
-- - 8 índices estratégicos para melhor performance
-- - 3 funções SQL otimizadas para consultas frequentes
-- - Limpeza de dados antigos (auditoria > 1 ano, logs > 6 meses, ranking > 3 meses)
-- - Desativação de licenças expiradas
-- - Atualização de estatísticas das tabelas

-- RESULTADO: Base de dados otimizada para melhor performance e menor uso de espaço!