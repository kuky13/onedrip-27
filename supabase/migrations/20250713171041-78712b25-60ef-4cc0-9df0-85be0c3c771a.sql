-- CORREÇÃO DE SEGURANÇA - PROJETO OLIVEIRA  
-- Etapa 2: Remoção completa de políticas dependentes

-- =====================================================
-- REMOÇÃO DE TODAS AS POLÍTICAS QUE USAM check_if_user_is_admin
-- =====================================================

-- TABELA: user_profiles
DROP POLICY IF EXISTS "Users can view own profile and admins view all" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile and admins update all" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile and admins insert all" ON public.user_profiles;
DROP POLICY IF EXISTS "Only admins can delete user profiles" ON public.user_profiles;

-- TABELA: admin_logs
DROP POLICY IF EXISTS "Only admins can access admin logs" ON public.admin_logs;

-- TABELA: budgets
DROP POLICY IF EXISTS "Admins can manage all budgets" ON public.budgets;

-- TABELA: budget_parts
DROP POLICY IF EXISTS "Admins can view all budget parts" ON public.budget_parts;
DROP POLICY IF EXISTS "Admins can manage all budget parts" ON public.budget_parts;

-- TABELA: budget_deletion_audit
DROP POLICY IF EXISTS "Admins can view all deletion audit" ON public.budget_deletion_audit;
DROP POLICY IF EXISTS "Admins can update all deletion audit records" ON public.budget_deletion_audit;

-- Agora podemos remover a função
DROP FUNCTION IF EXISTS public.check_if_user_is_admin(uuid);

-- =====================================================
-- CRIAÇÃO DE POLÍTICAS PADRONIZADAS PARA user_profiles
-- =====================================================

-- Políticas limpas para user_profiles
CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
  FOR SELECT USING (
    id = auth.uid() OR is_current_user_admin()
  );

CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
  FOR INSERT WITH CHECK (
    id = auth.uid() OR is_current_user_admin()
  );

CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
  FOR UPDATE USING (
    id = auth.uid() OR is_current_user_admin()
  );

CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles
  FOR DELETE USING (
    is_current_user_admin() AND id != auth.uid()
  );

-- =====================================================
-- RECRIAÇÃO DE POLÍTICAS PARA admin_logs
-- =====================================================

CREATE POLICY "admin_logs_all_policy" ON public.admin_logs
  FOR ALL USING (is_current_user_admin());

-- =====================================================
-- RECRIAÇÃO DE POLÍTICAS PARA budget_deletion_audit
-- =====================================================

CREATE POLICY "budget_deletion_audit_admin_select" ON public.budget_deletion_audit
  FOR SELECT USING (
    deleted_by = auth.uid() OR is_current_user_admin()
  );

CREATE POLICY "budget_deletion_audit_admin_update" ON public.budget_deletion_audit
  FOR UPDATE USING (
    deleted_by = auth.uid() OR is_current_user_admin()
  ) WITH CHECK (
    deleted_by = auth.uid() OR is_current_user_admin()
  );