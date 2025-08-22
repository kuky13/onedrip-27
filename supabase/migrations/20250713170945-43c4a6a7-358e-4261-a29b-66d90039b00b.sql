-- CORREÇÃO COMPLETA DAS POLÍTICAS RLS E SEGURANÇA
-- Projeto Oliveira - Análise e Correção de Segurança

-- =====================================================
-- 1. PADRONIZAÇÃO DAS FUNÇÕES DE ADMIN
-- =====================================================

-- Remover funções inconsistentes e manter apenas uma padronizada
DROP FUNCTION IF EXISTS public.is_user_admin();
DROP FUNCTION IF EXISTS public.check_if_user_is_admin(uuid);

-- Manter apenas is_current_user_admin() como função principal
-- Já existe e está correta, apenas adicionar alias para compatibilidade
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.is_current_user_admin();
$$;

-- Função para verificar se outro usuário é admin (para uso por admins)
CREATE OR REPLACE FUNCTION public.is_user_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = target_user_id AND role = 'admin' AND is_active = true
  );
$$;

-- =====================================================
-- 2. LIMPEZA E RECRIAÇÃO DAS POLÍTICAS RLS
-- =====================================================

-- TABELA: budgets
-- Remover todas as políticas conflitantes
DROP POLICY IF EXISTS "Admins can manage all budgets" ON public.budgets;
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

-- TABELA: budget_parts
-- Remover todas as políticas conflitantes
DROP POLICY IF EXISTS "Admins can manage all budget parts" ON public.budget_parts;
DROP POLICY IF EXISTS "Admins can view all budget parts" ON public.budget_parts;
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

-- TABELA: clients
-- Remover políticas muito permissivas
DROP POLICY IF EXISTS "Acesso público para clientes" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "rls_clients_delete" ON public.clients;
DROP POLICY IF EXISTS "rls_clients_insert" ON public.clients;
DROP POLICY IF EXISTS "rls_clients_select" ON public.clients;
DROP POLICY IF EXISTS "rls_clients_update" ON public.clients;

-- Criar políticas restritivas para clients
CREATE POLICY "clients_select_policy" ON public.clients
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "clients_insert_policy" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "clients_update_policy" ON public.clients
  FOR UPDATE USING (auth.uid() IS NOT NULL OR is_current_user_admin());

CREATE POLICY "clients_delete_policy" ON public.clients
  FOR DELETE USING (is_current_user_admin());

-- TABELA: brands
-- Remover políticas conflitantes
DROP POLICY IF EXISTS "Everyone can view brands" ON public.brands;
DROP POLICY IF EXISTS "Only admins can modify brands" ON public.brands;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias marcas" ON public.brands;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias marcas" ON public.brands;
DROP POLICY IF EXISTS "Usuários podem inserir marcas" ON public.brands;
DROP POLICY IF EXISTS "Usuários podem ver todas as marcas" ON public.brands;
DROP POLICY IF EXISTS "rls_brands_modify" ON public.brands;
DROP POLICY IF EXISTS "rls_brands_select" ON public.brands;

-- Criar políticas consistentes para brands
CREATE POLICY "brands_select_policy" ON public.brands
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "brands_insert_policy" ON public.brands
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR user_id IS NULL OR is_current_user_admin())
  );

CREATE POLICY "brands_update_policy" ON public.brands
  FOR UPDATE USING (
    (user_id = auth.uid() OR user_id IS NULL) OR 
    is_current_user_admin()
  );

CREATE POLICY "brands_delete_policy" ON public.brands
  FOR DELETE USING (
    (user_id = auth.uid() OR user_id IS NULL) OR 
    is_current_user_admin()
  );

-- TABELA: defect_types
-- Remover política muito permissiva
DROP POLICY IF EXISTS "Allow full access to defect_types" ON public.defect_types;
DROP POLICY IF EXISTS "Everyone can view defect types" ON public.defect_types;
DROP POLICY IF EXISTS "Only admins can modify defect types" ON public.defect_types;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios tipos de defeitos" ON public.defect_types;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios tipos de defeitos" ON public.defect_types;
DROP POLICY IF EXISTS "Usuários podem inserir tipos de defeitos" ON public.defect_types;
DROP POLICY IF EXISTS "Usuários podem ver todos os tipos de defeitos" ON public.defect_types;
DROP POLICY IF EXISTS "rls_defect_types_modify" ON public.defect_types;
DROP POLICY IF EXISTS "rls_defect_types_select" ON public.defect_types;

-- Criar políticas restritivas para defect_types
CREATE POLICY "defect_types_select_policy" ON public.defect_types
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "defect_types_insert_policy" ON public.defect_types
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR is_current_user_admin())
  );

CREATE POLICY "defect_types_update_policy" ON public.defect_types
  FOR UPDATE USING (
    (user_id = auth.uid() OR user_id IS NULL) OR 
    is_current_user_admin()
  );

CREATE POLICY "defect_types_delete_policy" ON public.defect_types
  FOR DELETE USING (
    (user_id = auth.uid() OR user_id IS NULL) OR 
    is_current_user_admin()
  );

-- =====================================================
-- 3. PADRONIZAÇÃO DAS DEMAIS TABELAS
-- =====================================================

-- Tabelas que requerem apenas acesso autenticado
CREATE OR REPLACE FUNCTION create_standard_auth_policies(table_name text) 
RETURNS void AS $$
BEGIN
  -- Para tabelas de configuração que todos os usuários autenticados podem ler
  -- mas apenas admins podem modificar
  EXECUTE format('DROP POLICY IF EXISTS "rls_%s_select" ON public.%s', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "rls_%s_modify" ON public.%s', table_name, table_name);
  
  EXECUTE format('CREATE POLICY "%s_select_policy" ON public.%s FOR SELECT USING (auth.uid() IS NOT NULL)', table_name, table_name);
  EXECUTE format('CREATE POLICY "%s_modify_policy" ON public.%s FOR ALL USING (is_current_user_admin())', table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Aplicar para tabelas de configuração
SELECT create_standard_auth_policies('device_types');
SELECT create_standard_auth_policies('payment_conditions'); 
SELECT create_standard_auth_policies('warranty_periods');

-- Remover a função temporária
DROP FUNCTION create_standard_auth_policies(text);

-- =====================================================
-- 4. VALIDAÇÃO FINAL E TRIGGERS DE SEGURANÇA
-- =====================================================

-- Trigger para garantir que owner_id seja sempre preenchido
CREATE OR REPLACE FUNCTION ensure_budget_owner_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Garantir que owner_id seja sempre o usuário atual
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  
  -- Validar que apenas o próprio usuário ou admin pode criar orçamentos
  IF NEW.owner_id != auth.uid() AND NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: usuário só pode criar orçamentos para si mesmo';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger se não existir
DROP TRIGGER IF EXISTS ensure_budget_owner ON public.budgets;
CREATE TRIGGER ensure_budget_owner
  BEFORE INSERT OR UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION ensure_budget_owner_trigger();

-- =====================================================
-- 5. FUNÇÃO DE DIAGNÓSTICO PARA MONITORAMENTO
-- =====================================================

CREATE OR REPLACE FUNCTION public.security_health_check()
RETURNS TABLE(
  table_name text,
  rls_enabled boolean,
  policy_count bigint,
  security_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::text,
    t.rowsecurity,
    COUNT(p.policyname),
    CASE 
      WHEN t.rowsecurity AND COUNT(p.policyname) > 0 THEN 'SEGURO'
      WHEN t.rowsecurity AND COUNT(p.policyname) = 0 THEN 'RLS SEM POLÍTICAS'
      ELSE 'VULNERÁVEL'
    END::text
  FROM pg_tables t
  LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
  WHERE t.schemaname = 'public'
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;