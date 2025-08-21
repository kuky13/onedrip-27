
-- 1. Limpar políticas RLS conflitantes na tabela budgets
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can only view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can only insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can only update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can only delete their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Acesso público aos orçamentos" ON public.budgets;

-- 2. Criar políticas RLS simples e corretas para budgets
CREATE POLICY "Budget owner can view" ON public.budgets
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Budget owner can insert" ON public.budgets
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Budget owner can update" ON public.budgets
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Budget owner can delete" ON public.budgets
  FOR DELETE USING (owner_id = auth.uid());

-- 3. Limpar políticas RLS conflitantes na tabela budget_parts
DROP POLICY IF EXISTS "Users can view budget parts of their budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can insert budget parts to their budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can update budget parts of their budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can delete budget parts of their budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can only view parts of their own budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can only insert parts to their own budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can only update parts of their own budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can only delete parts of their own budgets" ON public.budget_parts;

-- 4. Criar políticas RLS simples e corretas para budget_parts
CREATE POLICY "Budget parts owner can view" ON public.budget_parts
  FOR SELECT USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Budget parts owner can insert" ON public.budget_parts
  FOR INSERT WITH CHECK (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Budget parts owner can update" ON public.budget_parts
  FOR UPDATE USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Budget parts owner can delete" ON public.budget_parts
  FOR DELETE USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    )
  );

-- 5. Criar função para exclusão segura de orçamentos (com partes)
CREATE OR REPLACE FUNCTION public.delete_budget_with_parts(p_budget_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  budget_owner_id uuid;
BEGIN
  -- Verificar se o orçamento existe e obter o owner_id
  SELECT owner_id INTO budget_owner_id
  FROM public.budgets
  WHERE id = p_budget_id;

  -- Se orçamento não existe, retornar false
  IF budget_owner_id IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar se o usuário atual é o proprietário
  IF budget_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado: você só pode excluir seus próprios orçamentos';
  END IF;

  -- Excluir primeiro as partes do orçamento
  DELETE FROM public.budget_parts 
  WHERE budget_id = p_budget_id;

  -- Depois excluir o orçamento
  DELETE FROM public.budgets 
  WHERE id = p_budget_id;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro e re-lançar a exceção
    RAISE EXCEPTION 'Erro ao excluir orçamento: %', SQLERRM;
END;
$$;
