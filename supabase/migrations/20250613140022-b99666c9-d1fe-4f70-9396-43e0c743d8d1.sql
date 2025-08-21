
-- Habilitar RLS em todas as tabelas que não têm (verificando se já não está habilitado)
DO $$
BEGIN
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'budgets' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'budget_parts' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.budget_parts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'brands' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'defect_types' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.defect_types ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'clients' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'shop_profiles' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.shop_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_profiles' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Criar função de segurança para verificar role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Criar função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Remover políticas existentes que podem conflitar
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

-- Recriar políticas para budgets
CREATE POLICY "Users can view their own budgets" ON public.budgets
  FOR SELECT USING (owner_id = auth.uid() OR public.is_user_admin());

CREATE POLICY "Users can insert their own budgets" ON public.budgets
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own budgets" ON public.budgets
  FOR UPDATE USING (owner_id = auth.uid() OR public.is_user_admin());

CREATE POLICY "Users can delete their own budgets" ON public.budgets
  FOR DELETE USING (owner_id = auth.uid() OR public.is_user_admin());

-- Políticas para budget_parts
DROP POLICY IF EXISTS "Users can view budget parts of their budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can insert budget parts to their budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can update budget parts of their budgets" ON public.budget_parts;
DROP POLICY IF EXISTS "Users can delete budget parts of their budgets" ON public.budget_parts;

CREATE POLICY "Users can view budget parts of their budgets" ON public.budget_parts
  FOR SELECT USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    ) OR public.is_user_admin()
  );

CREATE POLICY "Users can insert budget parts to their budgets" ON public.budget_parts
  FOR INSERT WITH CHECK (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budget parts of their budgets" ON public.budget_parts
  FOR UPDATE USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    ) OR public.is_user_admin()
  );

CREATE POLICY "Users can delete budget parts of their budgets" ON public.budget_parts
  FOR DELETE USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE owner_id = auth.uid()
    ) OR public.is_user_admin()
  );

-- Políticas para outras tabelas
DROP POLICY IF EXISTS "Everyone can view brands" ON public.brands;
DROP POLICY IF EXISTS "Only admins can modify brands" ON public.brands;

CREATE POLICY "Everyone can view brands" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify brands" ON public.brands
  FOR ALL USING (public.is_user_admin());

-- Políticas para defect_types
DROP POLICY IF EXISTS "Everyone can view defect types" ON public.defect_types;
DROP POLICY IF EXISTS "Only admins can modify defect types" ON public.defect_types;

CREATE POLICY "Everyone can view defect types" ON public.defect_types
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify defect types" ON public.defect_types
  FOR ALL USING (public.is_user_admin());

-- Políticas para clients
DROP POLICY IF EXISTS "Users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients" ON public.clients;

CREATE POLICY "Users can view all clients" ON public.clients
  FOR SELECT USING (true);

CREATE POLICY "Users can insert clients" ON public.clients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update clients" ON public.clients
  FOR UPDATE USING (true);

-- Políticas para shop_profiles
DROP POLICY IF EXISTS "Users can view their own shop profile" ON public.shop_profiles;
DROP POLICY IF EXISTS "Users can insert their own shop profile" ON public.shop_profiles;
DROP POLICY IF EXISTS "Users can update their own shop profile" ON public.shop_profiles;

CREATE POLICY "Users can view their own shop profile" ON public.shop_profiles
  FOR SELECT USING (user_id = auth.uid() OR public.is_user_admin());

CREATE POLICY "Users can insert their own shop profile" ON public.shop_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own shop profile" ON public.shop_profiles
  FOR UPDATE USING (user_id = auth.uid() OR public.is_user_admin());

-- Políticas para user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (id = auth.uid() OR public.is_user_admin());

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_user_admin());

-- Adicionar foreign keys apenas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_budget_parts_budget_id'
    ) THEN
        ALTER TABLE public.budget_parts 
        ADD CONSTRAINT fk_budget_parts_budget_id 
        FOREIGN KEY (budget_id) REFERENCES public.budgets(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Adicionar indexes para performance
CREATE INDEX IF NOT EXISTS idx_budgets_owner_id ON public.budgets(owner_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON public.budgets(created_at);
CREATE INDEX IF NOT EXISTS idx_budget_parts_budget_id ON public.budget_parts(budget_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover triggers existentes e recriar
DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_shop_profiles_updated_at ON public.shop_profiles;

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_profiles_updated_at
  BEFORE UPDATE ON public.shop_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
