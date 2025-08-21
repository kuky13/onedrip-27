-- ==================================================================
-- IMPLEMENTAÇÃO COMPLETA DE POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ==================================================================

-- 1. VERIFICAR E ATIVAR RLS EM TODAS AS TABELAS PRINCIPAIS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_profiles ENABLE ROW LEVEL SECURITY;

-- 2. REMOVER POLÍTICAS CONFLITANTES EXISTENTES (LIMPEZA)
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can only update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can only insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Admins can view all budgets" ON public.budgets;

-- 3. CRIAR FUNÇÃO AUXILIAR PARA VERIFICAR SE USUÁRIO É ADMIN
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  user_active BOOLEAN;
BEGIN
  -- Verificar se há usuário autenticado
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Buscar role e status ativo do usuário
  SELECT role, is_active 
  INTO user_role, user_active
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  -- Retornar true apenas se for admin ativo
  RETURN (user_role = 'admin' AND user_active = TRUE);
END;
$$;

-- 4. POLÍTICAS RLS PARA USER_PROFILES
CREATE POLICY "rls_user_profiles_select" ON public.user_profiles
FOR SELECT USING (
  id = auth.uid() OR public.is_current_user_admin()
);

CREATE POLICY "rls_user_profiles_insert" ON public.user_profiles
FOR INSERT WITH CHECK (
  id = auth.uid() OR public.is_current_user_admin()
);

CREATE POLICY "rls_user_profiles_update" ON public.user_profiles
FOR UPDATE USING (
  id = auth.uid() OR public.is_current_user_admin()
);

CREATE POLICY "rls_user_profiles_delete" ON public.user_profiles
FOR DELETE USING (
  public.is_current_user_admin() AND id != auth.uid()
);

-- 5. POLÍTICAS RLS PARA BUDGETS
CREATE POLICY "rls_budgets_select" ON public.budgets
FOR SELECT USING (
  (owner_id = auth.uid() AND deleted_at IS NULL) OR public.is_current_user_admin()
);

CREATE POLICY "rls_budgets_insert" ON public.budgets
FOR INSERT WITH CHECK (
  owner_id = auth.uid() AND auth.uid() IS NOT NULL
);

CREATE POLICY "rls_budgets_update" ON public.budgets
FOR UPDATE USING (
  (owner_id = auth.uid() AND deleted_at IS NULL) OR public.is_current_user_admin()
);

CREATE POLICY "rls_budgets_delete" ON public.budgets
FOR DELETE USING (
  owner_id = auth.uid() OR public.is_current_user_admin()
);

-- 6. POLÍTICAS RLS PARA BUDGET_PARTS
CREATE POLICY "rls_budget_parts_select" ON public.budget_parts
FOR SELECT USING (
  (budget_id IN (
    SELECT id FROM public.budgets 
    WHERE owner_id = auth.uid() AND deleted_at IS NULL
  )) OR public.is_current_user_admin()
);

CREATE POLICY "rls_budget_parts_insert" ON public.budget_parts
FOR INSERT WITH CHECK (
  budget_id IN (
    SELECT id FROM public.budgets 
    WHERE owner_id = auth.uid() AND deleted_at IS NULL
  ) AND auth.uid() IS NOT NULL
);

CREATE POLICY "rls_budget_parts_update" ON public.budget_parts
FOR UPDATE USING (
  (budget_id IN (
    SELECT id FROM public.budgets 
    WHERE owner_id = auth.uid() AND deleted_at IS NULL
  )) OR public.is_current_user_admin()
);

CREATE POLICY "rls_budget_parts_delete" ON public.budget_parts
FOR DELETE USING (
  (budget_id IN (
    SELECT id FROM public.budgets 
    WHERE owner_id = auth.uid() AND deleted_at IS NULL
  )) OR public.is_current_user_admin()
);

-- 7. POLÍTICAS RLS PARA CLIENTS (Acesso público controlado)
CREATE POLICY "rls_clients_select" ON public.clients
FOR SELECT USING (
  auth.uid() IS NOT NULL -- Apenas usuários autenticados
);

CREATE POLICY "rls_clients_insert" ON public.clients
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL -- Apenas usuários autenticados
);

CREATE POLICY "rls_clients_update" ON public.clients
FOR UPDATE USING (
  auth.uid() IS NOT NULL OR public.is_current_user_admin()
);

CREATE POLICY "rls_clients_delete" ON public.clients
FOR DELETE USING (
  public.is_current_user_admin()
);

-- 8. POLÍTICAS RLS PARA SHOP_PROFILES
CREATE POLICY "rls_shop_profiles_select" ON public.shop_profiles
FOR SELECT USING (
  user_id = auth.uid() OR public.is_current_user_admin()
);

CREATE POLICY "rls_shop_profiles_insert" ON public.shop_profiles
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND auth.uid() IS NOT NULL
);

CREATE POLICY "rls_shop_profiles_update" ON public.shop_profiles
FOR UPDATE USING (
  user_id = auth.uid() OR public.is_current_user_admin()
);

CREATE POLICY "rls_shop_profiles_delete" ON public.shop_profiles
FOR DELETE USING (
  user_id = auth.uid() OR public.is_current_user_admin()
);

-- 9. POLÍTICAS RLS PARA ADMIN_LOGS (Apenas admins)
CREATE POLICY "rls_admin_logs_select" ON public.admin_logs
FOR SELECT USING (
  public.is_current_user_admin()
);

CREATE POLICY "rls_admin_logs_insert" ON public.admin_logs
FOR INSERT WITH CHECK (
  public.is_current_user_admin()
);

CREATE POLICY "rls_admin_logs_update" ON public.admin_logs
FOR UPDATE USING (
  public.is_current_user_admin()
);

CREATE POLICY "rls_admin_logs_delete" ON public.admin_logs
FOR DELETE USING (
  public.is_current_user_admin()
);

-- 10. POLÍTICAS PARA TABELAS DE CONFIGURAÇÃO (Apenas admins podem modificar)
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defect_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_periods ENABLE ROW LEVEL SECURITY;

-- Leitura pública, modificação apenas por admins
CREATE POLICY "rls_brands_select" ON public.brands FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rls_brands_modify" ON public.brands FOR ALL USING (public.is_current_user_admin());

CREATE POLICY "rls_device_types_select" ON public.device_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rls_device_types_modify" ON public.device_types FOR ALL USING (public.is_current_user_admin());

CREATE POLICY "rls_defect_types_select" ON public.defect_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rls_defect_types_modify" ON public.defect_types FOR ALL USING (public.is_current_user_admin());

CREATE POLICY "rls_payment_conditions_select" ON public.payment_conditions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rls_payment_conditions_modify" ON public.payment_conditions FOR ALL USING (public.is_current_user_admin());

CREATE POLICY "rls_warranty_periods_select" ON public.warranty_periods FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rls_warranty_periods_modify" ON public.warranty_periods FOR ALL USING (public.is_current_user_admin());

-- 11. TRIGGER PARA GARANTIR OWNER_ID NOS BUDGETS
CREATE OR REPLACE FUNCTION public.ensure_budget_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Garantir que owner_id seja sempre o usuário atual
  IF NEW.owner_id IS NULL OR NEW.owner_id != auth.uid() THEN
    NEW.owner_id := auth.uid();
  END IF;
  
  -- Validar que apenas o próprio usuário pode criar orçamentos para si
  IF NEW.owner_id != auth.uid() AND NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Usuário só pode criar orçamentos para si mesmo';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_ensure_budget_owner
  BEFORE INSERT OR UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.ensure_budget_owner();

-- 12. FUNÇÃO DE VALIDAÇÃO DE SEGURANÇA
CREATE OR REPLACE FUNCTION public.validate_rls_security()
RETURNS TABLE(
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count INTEGER,
  security_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity::BOOLEAN,
    COALESCE(p.policy_count, 0)::INTEGER,
    CASE 
      WHEN t.rowsecurity AND COALESCE(p.policy_count, 0) > 0 THEN 'SEGURO'
      WHEN t.rowsecurity AND COALESCE(p.policy_count, 0) = 0 THEN 'RLS ATIVO SEM POLÍTICAS'
      ELSE 'VULNERÁVEL - RLS DESABILITADO'
    END::TEXT
  FROM pg_tables t
  LEFT JOIN (
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename
  ) p ON t.tablename = p.tablename
  WHERE t.schemaname = 'public'
  ORDER BY t.tablename;
END;
$$;

-- COMENTÁRIOS E DOCUMENTAÇÃO
COMMENT ON FUNCTION public.is_current_user_admin() IS 'Verifica se o usuário atual é um administrador ativo';
COMMENT ON FUNCTION public.ensure_budget_owner() IS 'Garante que orçamentos sejam criados apenas pelo proprietário correto';
COMMENT ON FUNCTION public.validate_rls_security() IS 'Valida o status de segurança RLS de todas as tabelas';