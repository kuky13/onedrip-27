
-- Habilitar RLS em todas as tabelas que ainda não têm
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defect_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para brands
DROP POLICY IF EXISTS "Everyone can view brands" ON public.brands;
DROP POLICY IF EXISTS "Only admins can modify brands" ON public.brands;

CREATE POLICY "Everyone can view brands" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify brands" ON public.brands
  FOR ALL USING (public.is_user_admin());

-- Criar políticas RLS para defect_types
DROP POLICY IF EXISTS "Everyone can view defect types" ON public.defect_types;
DROP POLICY IF EXISTS "Only admins can modify defect types" ON public.defect_types;

CREATE POLICY "Everyone can view defect types" ON public.defect_types
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify defect types" ON public.defect_types
  FOR ALL USING (public.is_user_admin());

-- Criar políticas RLS para device_types
DROP POLICY IF EXISTS "Everyone can view device types" ON public.device_types;
DROP POLICY IF EXISTS "Only admins can modify device types" ON public.device_types;

CREATE POLICY "Everyone can view device types" ON public.device_types
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify device types" ON public.device_types
  FOR ALL USING (public.is_user_admin());

-- Criar políticas RLS para payment_conditions
DROP POLICY IF EXISTS "Everyone can view payment conditions" ON public.payment_conditions;
DROP POLICY IF EXISTS "Only admins can modify payment conditions" ON public.payment_conditions;

CREATE POLICY "Everyone can view payment conditions" ON public.payment_conditions
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify payment conditions" ON public.payment_conditions
  FOR ALL USING (public.is_user_admin());

-- Criar políticas RLS para warranty_periods
DROP POLICY IF EXISTS "Everyone can view warranty periods" ON public.warranty_periods;
DROP POLICY IF EXISTS "Only admins can modify warranty periods" ON public.warranty_periods;

CREATE POLICY "Everyone can view warranty periods" ON public.warranty_periods
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify warranty periods" ON public.warranty_periods
  FOR ALL USING (public.is_user_admin());

-- Criar políticas RLS para profiles (tabela legacy)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_user_admin());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_user_admin());

-- Criar políticas RLS para admin_users (apenas admins podem ver/modificar)
DROP POLICY IF EXISTS "Only admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can modify admin users" ON public.admin_users;

CREATE POLICY "Only admins can view admin users" ON public.admin_users
  FOR SELECT USING (public.is_user_admin());

CREATE POLICY "Only admins can modify admin users" ON public.admin_users
  FOR ALL USING (public.is_user_admin());

-- Corrigir foreign keys e constraints
-- Adicionar foreign key para budget_parts -> brands
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_budget_parts_brand_id'
    ) THEN
        ALTER TABLE public.budget_parts 
        ADD CONSTRAINT fk_budget_parts_brand_id 
        FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Adicionar constraint para garantir que owner_id seja sempre preenchido
ALTER TABLE public.budgets 
ALTER COLUMN owner_id SET NOT NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_budget_parts_brand_id ON public.budget_parts(brand_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_budgets_owner_id ON public.budgets(owner_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON public.budgets(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);

-- Criar trigger para validação de dados
CREATE OR REPLACE FUNCTION public.validate_budget_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que o preço total é positivo
  IF NEW.total_price <= 0 THEN
    RAISE EXCEPTION 'Preço total deve ser maior que zero';
  END IF;
  
  -- Validar que as datas fazem sentido
  IF NEW.delivery_date IS NOT NULL AND NEW.delivery_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Data de entrega não pode ser no passado';
  END IF;
  
  -- Garantir que owner_id seja definido
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validação de orçamentos
DROP TRIGGER IF EXISTS validate_budget_trigger ON public.budgets;
CREATE TRIGGER validate_budget_trigger
  BEFORE INSERT OR UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_budget_data();

-- Criar função para auditoria de acesso
CREATE OR REPLACE FUNCTION public.log_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log simples no console (para desenvolvimento)
  RAISE NOTICE 'Acesso à tabela % por usuário %', TG_TABLE_NAME, auth.uid();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de auditoria nas tabelas principais
DROP TRIGGER IF EXISTS audit_budgets_access ON public.budgets;
CREATE TRIGGER audit_budgets_access
  AFTER INSERT OR UPDATE OR DELETE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_access();

DROP TRIGGER IF EXISTS audit_budget_parts_access ON public.budget_parts;
CREATE TRIGGER audit_budget_parts_access
  AFTER INSERT OR UPDATE OR DELETE ON public.budget_parts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_access();
