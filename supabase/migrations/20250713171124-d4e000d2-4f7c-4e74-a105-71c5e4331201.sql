-- CORREÇÃO DE SEGURANÇA - PROJETO OLIVEIRA
-- Etapa 3: Limpeza das principais tabelas de dados

-- =====================================================
-- LIMPEZA DAS POLÍTICAS DA TABELA BUDGETS
-- =====================================================

-- Remover todas as políticas conflitantes de budgets
DROP POLICY IF EXISTS "Budgets: users can delete own" ON public.budgets;
DROP POLICY IF EXISTS "Budgets: users can insert own" ON public.budgets;
DROP POLICY IF EXISTS "Budgets: users can update own" ON public.budgets;
DROP POLICY IF EXISTS "Budgets: users can view own" ON public.budgets;
DROP POLICY IF EXISTS "Users can soft delete own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update own active budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can view own active budgets" ON public.budgets;
DROP POLICY IF EXISTS "rls_budgets_delete" ON public.budgets;
DROP POLICY IF EXISTS "rls_budgets_delete_secure" ON public.budgets;
DROP POLICY IF EXISTS "rls_budgets_insert" ON public.budgets;
DROP POLICY IF EXISTS "rls_budgets_insert_secure" ON public.budgets;
DROP POLICY IF EXISTS "rls_budgets_select" ON public.budgets;
DROP POLICY IF EXISTS "rls_budgets_select_secure" ON public.budgets;
DROP POLICY IF EXISTS "rls_budgets_update" ON public.budgets;
DROP POLICY IF EXISTS "rls_budgets_update_secure" ON public.budgets;

-- Criar políticas limpas e consistentes para budgets
CREATE POLICY "budgets_select_policy" ON public.budgets
  FOR SELECT USING (
    (owner_id = auth.uid() AND deleted_at IS NULL) OR 
    is_current_user_admin()
  );

CREATE POLICY "budgets_insert_policy" ON public.budgets
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (owner_id = auth.uid() OR owner_id IS NULL)
  );

CREATE POLICY "budgets_update_policy" ON public.budgets
  FOR UPDATE USING (
    (owner_id = auth.uid() AND deleted_at IS NULL) OR 
    is_current_user_admin()
  );

CREATE POLICY "budgets_delete_policy" ON public.budgets
  FOR DELETE USING (
    owner_id = auth.uid() OR 
    is_current_user_admin()
  );

-- =====================================================
-- LIMPEZA DAS POLÍTICAS DA TABELA BUDGET_PARTS
-- =====================================================

-- Remover todas as políticas conflitantes de budget_parts
DROP POLICY IF EXISTS "Budget parts: users can delete own" ON public.budget_parts;
DROP POLICY IF EXISTS "Budget parts: users can insert own" ON public.budget_parts;
DROP POLICY IF EXISTS "Budget parts: users can update own" ON public.budget_parts;
DROP POLICY IF EXISTS "Budget parts: users can view own" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can manage parts of own active budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can view parts of own active budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "rls_budget_parts_delete" ON public.budget_parts;
DROP POLICY IF EXISTS "rls_budget_parts_insert" ON public.budget_parts;
DROP POLICY IF EXISTS "rls_budget_parts_select" ON public.budget_parts;
DROP POLICY IF EXISTS "rls_budget_parts_update" ON public.budget_parts;

-- Criar políticas limpas para budget_parts
CREATE POLICY "budget_parts_select_policy" ON public.budget_parts
  FOR SELECT USING (
    (budget_id IN (
      SELECT id FROM public.budgets 
      WHERE owner_id = auth.uid() AND deleted_at IS NULL
    ) AND deleted_at IS NULL) OR 
    is_current_user_admin()
  );

CREATE POLICY "budget_parts_insert_policy" ON public.budget_parts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    budget_id IN (
      SELECT id FROM public.budgets 
      WHERE owner_id = auth.uid() AND deleted_at IS NULL
    )
  );

CREATE POLICY "budget_parts_update_policy" ON public.budget_parts
  FOR UPDATE USING (
    (budget_id IN (
      SELECT id FROM public.budgets 
      WHERE owner_id = auth.uid() AND deleted_at IS NULL
    ) AND deleted_at IS NULL) OR 
    is_current_user_admin()
  );

CREATE POLICY "budget_parts_delete_policy" ON public.budget_parts
  FOR DELETE USING (
    (budget_id IN (
      SELECT id FROM public.budgets 
      WHERE owner_id = auth.uid() AND deleted_at IS NULL
    )) OR 
    is_current_user_admin()
  );