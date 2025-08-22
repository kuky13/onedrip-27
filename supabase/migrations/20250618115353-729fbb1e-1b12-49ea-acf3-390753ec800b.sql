
-- 1. Limpar todas as políticas RLS conflitantes das tabelas budgets e budget_parts
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can only view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can only insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can only update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can only delete their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Budget owner can view" ON public.budgets;
DROP POLICY IF EXISTS "Budget owner can insert" ON public.budgets;
DROP POLICY IF EXISTS "Budget owner can update" ON public.budgets;
DROP POLICY IF EXISTS "Budget owner can delete" ON public.budgets;

DROP POLICY IF EXISTS "Users can view budget parts of their budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can insert budget parts to their budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can update budget parts of their budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can delete budget parts of their budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can only view parts of their own budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can only insert parts to their own budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can only update parts of their own budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can only delete parts of their own budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Budget parts owner can view" ON public.budget_parts;
DROP POLICY IF EXISTS "Budget parts owner can insert" ON public.budget_parts;
DROP POLICY IF EXISTS "Budget parts owner can update" ON public.budget_parts;
DROP POLICY IF EXISTS "Budget parts owner can delete" ON public.budget_parts;

-- 2. Criar políticas RLS simples e funcionais para budgets
CREATE POLICY "Budgets: users can view own" ON public.budgets
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Budgets: users can insert own" ON public.budgets
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Budgets: users can update own" ON public.budgets
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Budgets: users can delete own" ON public.budgets
  FOR DELETE USING (owner_id = auth.uid());

-- 3. Criar políticas RLS simples e funcionais para budget_parts
CREATE POLICY "Budget parts: users can view own" ON public.budget_parts
  FOR SELECT USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Budget parts: users can insert own" ON public.budget_parts
  FOR INSERT WITH CHECK (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Budget parts: users can update own" ON public.budget_parts
  FOR UPDATE USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Budget parts: users can delete own" ON public.budget_parts
  FOR DELETE USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    )
  );

-- 4. Recriar a função de exclusão segura de orçamentos com melhor tratamento de erros
DROP FUNCTION IF EXISTS public.delete_budget_with_parts(uuid);

CREATE OR REPLACE FUNCTION public.delete_budget_with_parts(p_budget_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  budget_owner_id uuid;
  current_user_id uuid;
  deleted_count integer;
BEGIN
  -- Obter o ID do usuário atual
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se o orçamento existe e obter o owner_id
  SELECT owner_id INTO budget_owner_id
  FROM public.budgets
  WHERE id = p_budget_id;

  -- Se orçamento não existe, retornar false
  IF budget_owner_id IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar se o usuário atual é o proprietário
  IF budget_owner_id != current_user_id THEN
    RAISE EXCEPTION 'Acesso negado: você só pode excluir seus próprios orçamentos';
  END IF;

  -- Excluir primeiro as partes do orçamento
  DELETE FROM public.budget_parts 
  WHERE budget_id = p_budget_id;

  -- Depois excluir o orçamento e verificar se foi excluído
  DELETE FROM public.budgets 
  WHERE id = p_budget_id AND owner_id = current_user_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count = 0 THEN
    RAISE EXCEPTION 'Falha ao excluir o orçamento';
  END IF;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-lançar a exceção com a mensagem original
    RAISE;
END;
$$;

-- 5. Criar função para exclusão em massa de orçamentos do usuário
CREATE OR REPLACE FUNCTION public.delete_all_user_budgets()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  deleted_count integer;
BEGIN
  -- Obter o ID do usuário atual
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Excluir primeiro todas as partes dos orçamentos do usuário
  DELETE FROM public.budget_parts 
  WHERE budget_id IN (
    SELECT id FROM public.budgets WHERE owner_id = current_user_id
  );

  -- Depois excluir todos os orçamentos do usuário
  DELETE FROM public.budgets 
  WHERE owner_id = current_user_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-lançar a exceção com a mensagem original
    RAISE;
END;
$$;

-- 6. Garantir que RLS está habilitado
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_parts ENABLE ROW LEVEL SECURITY;
