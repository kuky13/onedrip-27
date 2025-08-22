-- Corrigir problemas de RLS e owner_id na tabela budgets

-- 1. Criar função para garantir owner_id
CREATE OR REPLACE FUNCTION public.set_owner_id_if_null()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar trigger para garantir owner_id em INSERT/UPDATE
DROP TRIGGER IF EXISTS ensure_owner_id_trigger ON public.budgets;
CREATE TRIGGER ensure_owner_id_trigger
  BEFORE INSERT OR UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_owner_id_if_null();

-- 3. Atualizar políticas RLS para budgets (remover políticas conflitantes)
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

-- 4. Criar políticas RLS mais claras e seguras
CREATE POLICY "rls_budgets_select_secure" 
ON public.budgets 
FOR SELECT 
USING (
  -- Permitir acesso se for o dono do orçamento (não excluído) OU se for admin
  (owner_id = auth.uid() AND deleted_at IS NULL) 
  OR is_current_user_admin()
);

CREATE POLICY "rls_budgets_insert_secure" 
ON public.budgets 
FOR INSERT 
WITH CHECK (
  -- Apenas usuários autenticados podem inserir e o owner_id deve ser o próprio usuário
  auth.uid() IS NOT NULL AND 
  (owner_id = auth.uid() OR owner_id IS NULL)
);

CREATE POLICY "rls_budgets_update_secure" 
ON public.budgets 
FOR UPDATE 
USING (
  -- Pode atualizar se for o dono (não excluído) OU se for admin
  (owner_id = auth.uid() AND deleted_at IS NULL) 
  OR is_current_user_admin()
);

CREATE POLICY "rls_budgets_delete_secure" 
ON public.budgets 
FOR DELETE 
USING (
  -- Pode deletar se for o dono OU se for admin
  owner_id = auth.uid() OR is_current_user_admin()
);

-- 5. Função para corrigir registros órfãos de forma segura
-- NOTA: Esta função deve ser executada apenas por administradores
CREATE OR REPLACE FUNCTION public.fix_orphaned_budgets()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Verificar se é admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem executar esta função';
  END IF;
  
  -- Contar registros órfãos
  SELECT COUNT(*) INTO updated_count 
  FROM public.budgets 
  WHERE owner_id IS NULL;
  
  -- Log da operação
  RAISE NOTICE 'Encontrados % registros órfãos para correção', updated_count;
  
  -- Como não podemos definir um owner_id específico sem contexto,
  -- vamos apenas reportar quantos registros estão órfãos
  -- Um admin deve revisar manualmente esses casos
  
  RETURN updated_count;
END;
$$;

-- 6. Função para verificar integridade dos dados
CREATE OR REPLACE FUNCTION public.check_budgets_integrity()
RETURNS TABLE(
  total_budgets INTEGER,
  orphaned_budgets INTEGER,
  valid_budgets INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_budgets,
    COUNT(*) FILTER (WHERE owner_id IS NULL)::INTEGER as orphaned_budgets,
    COUNT(*) FILTER (WHERE owner_id IS NOT NULL)::INTEGER as valid_budgets
  FROM public.budgets;
END;
$$;