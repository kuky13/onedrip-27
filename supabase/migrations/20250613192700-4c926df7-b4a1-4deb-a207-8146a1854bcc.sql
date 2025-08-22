
-- Primeiro, remover as políticas em português que dependem da coluna user_id
DROP POLICY IF EXISTS "Usuários podem ver seus próprios orçamentos" ON public.budgets;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios orçamentos" ON public.budgets;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios orçamentos" ON public.budgets;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios orçamentos" ON public.budgets;

-- Agora podemos remover a coluna user_id com CASCADE se necessário
ALTER TABLE public.budgets DROP COLUMN IF EXISTS user_id CASCADE;

-- Garantir que owner_id tenha um default correto e não seja nulo
ALTER TABLE public.budgets 
ALTER COLUMN owner_id SET DEFAULT auth.uid(),
ALTER COLUMN owner_id SET NOT NULL;

-- 1. LIMPEZA COMPLETA DOS DADOS CONFORME SOLICITADO
-- Deletar todas as partes de orçamentos primeiro (devido à foreign key)
DELETE FROM public.budget_parts;

-- Deletar todos os orçamentos
DELETE FROM public.budgets;

-- Deletar todos os perfis de usuário
DELETE FROM public.user_profiles;

-- Deletar perfis de loja
DELETE FROM public.shop_profiles;

-- Deletar usuários autenticados (isso também remove dados relacionados)
DELETE FROM auth.users;

-- 2. REMOVER TODAS AS POLÍTICAS RLS EXISTENTES RESTANTES
-- Políticas da tabela budgets (qualquer uma que possa ter sobrado)
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Acesso público aos orçamentos" ON public.budgets;

-- Políticas da tabela budget_parts
DROP POLICY IF EXISTS "Users can view budget parts of their budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can insert budget parts to their budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can update budget parts of their budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can delete budget parts of their budgets" ON public.budget_parts;

-- Políticas da tabela user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- 3. CRIAR POLÍTICAS RLS SIMPLES E SEGURAS
-- Políticas para budgets - isolamento total por usuário
CREATE POLICY "Users can only view their own budgets" ON public.budgets
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can only insert their own budgets" ON public.budgets
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can only update their own budgets" ON public.budgets  
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can only delete their own budgets" ON public.budgets
  FOR DELETE USING (owner_id = auth.uid());

-- Políticas para budget_parts - acesso apenas às partes dos próprios orçamentos
CREATE POLICY "Users can only view parts of their own budgets" ON public.budget_parts
  FOR SELECT USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can only insert parts to their own budgets" ON public.budget_parts
  FOR INSERT WITH CHECK (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can only update parts of their own budgets" ON public.budget_parts
  FOR UPDATE USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can only delete parts of their own budgets" ON public.budget_parts
  FOR DELETE USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    )
  );

-- Políticas para user_profiles - usuários só podem ver/editar seu próprio perfil
CREATE POLICY "Users can only view their own profile" ON public.user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can only update their own profile" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can only insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_budgets_owner_id_optimized ON public.budgets(owner_id);
CREATE INDEX IF NOT EXISTS idx_budget_parts_budget_id_optimized ON public.budget_parts(budget_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id_optimized ON public.user_profiles(id);

-- 5. ATUALIZAR TRIGGER PARA GARANTIR owner_id
CREATE OR REPLACE FUNCTION public.ensure_owner_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Garantir que owner_id seja sempre preenchido com o usuário atual
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  
  -- Validar que o usuário só pode criar orçamentos para si mesmo
  IF NEW.owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Usuário só pode criar orçamentos para si mesmo';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nos orçamentos
DROP TRIGGER IF EXISTS ensure_owner_id_trigger ON public.budgets;
CREATE TRIGGER ensure_owner_id_trigger
  BEFORE INSERT OR UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_owner_id();

-- 6. FUNÇÃO DE VALIDAÇÃO ADICIONAL PARA BUDGET_PARTS
CREATE OR REPLACE FUNCTION public.validate_budget_part_ownership()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o orçamento pertence ao usuário atual
  IF NOT EXISTS (
    SELECT 1 FROM public.budgets 
    WHERE id = NEW.budget_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Não é possível adicionar partes a orçamentos de outros usuários';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas partes de orçamentos
DROP TRIGGER IF EXISTS validate_budget_part_ownership_trigger ON public.budget_parts;
CREATE TRIGGER validate_budget_part_ownership_trigger
  BEFORE INSERT OR UPDATE ON public.budget_parts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_budget_part_ownership();
