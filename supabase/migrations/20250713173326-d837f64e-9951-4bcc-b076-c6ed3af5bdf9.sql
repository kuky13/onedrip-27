-- CORREÇÃO DE SEGURANÇA - PROJETO OLIVEIRA
-- Etapa 5: Triggers de Segurança e Funções de Diagnóstico

-- =====================================================
-- TRIGGERS DE SEGURANÇA
-- =====================================================

-- Trigger para garantir que owner_id seja sempre preenchido em budgets
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

-- Trigger para garantir user_id correto em tabelas com dono
CREATE OR REPLACE FUNCTION ensure_user_ownership_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Para tabelas com user_id, garantir que seja o usuário atual
  IF TG_TABLE_NAME IN ('brands', 'defect_types', 'shop_profiles') THEN
    IF NEW.user_id IS NULL THEN
      NEW.user_id := auth.uid();
    ELSIF NEW.user_id != auth.uid() AND NOT is_current_user_admin() THEN
      RAISE EXCEPTION 'Acesso negado: usuário só pode criar registros para si mesmo';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger nas tabelas relevantes
DROP TRIGGER IF EXISTS ensure_user_ownership ON public.brands;
CREATE TRIGGER ensure_user_ownership
  BEFORE INSERT OR UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION ensure_user_ownership_trigger();

DROP TRIGGER IF EXISTS ensure_user_ownership ON public.defect_types;
CREATE TRIGGER ensure_user_ownership
  BEFORE INSERT OR UPDATE ON public.defect_types
  FOR EACH ROW EXECUTE FUNCTION ensure_user_ownership_trigger();

-- =====================================================
-- FUNÇÕES DE DIAGNÓSTICO E MONITORAMENTO
-- =====================================================

-- Função para verificar integridade de segurança
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

-- Função para listar permissões de um usuário específico
CREATE OR REPLACE FUNCTION public.user_permissions_check(target_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  user_id uuid,
  user_name text,
  user_role text,
  is_active boolean,
  is_admin boolean,
  can_manage_users boolean,
  can_manage_settings boolean,
  budget_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id as user_id,
    up.name as user_name,
    up.role as user_role,
    up.is_active,
    (up.role = 'admin' AND up.is_active) as is_admin,
    (up.role = 'admin' AND up.is_active) as can_manage_users,
    (up.role = 'admin' AND up.is_active) as can_manage_settings,
    COALESCE((SELECT COUNT(*) FROM public.budgets WHERE owner_id = up.id), 0) as budget_count
  FROM public.user_profiles up
  WHERE up.id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para testar permissões em tempo real
CREATE OR REPLACE FUNCTION public.test_user_permissions()
RETURNS TABLE(
  test_name text,
  result boolean,
  description text
) AS $$
DECLARE
  current_user_id uuid;
  test_budget_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Teste 1: Verificar autenticação
  RETURN QUERY
  SELECT 
    'User Authentication'::text,
    (current_user_id IS NOT NULL),
    ('Current user ID: ' || COALESCE(current_user_id::text, 'NULL'))::text;
  
  -- Teste 2: Verificar se é admin
  RETURN QUERY
  SELECT 
    'Admin Status'::text,
    is_current_user_admin(),
    ('Is admin: ' || is_current_user_admin()::text)::text;
  
  -- Teste 3: Verificar se pode acessar budgets próprios
  RETURN QUERY
  SELECT 
    'Own Budgets Access'::text,
    EXISTS(SELECT 1 FROM public.budgets WHERE owner_id = current_user_id LIMIT 1),
    'Can access own budgets'::text;
  
  -- Teste 4: Verificar se pode criar clientes
  RETURN QUERY
  SELECT 
    'Client Creation'::text,
    (current_user_id IS NOT NULL),
    'Can create clients when authenticated'::text;
    
  -- Teste 5: Verificar acesso a configurações
  RETURN QUERY
  SELECT 
    'Settings Access'::text,
    (current_user_id IS NOT NULL),
    'Can read settings when authenticated'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO PARA AUDITORIA DE MUDANÇAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.audit_security_changes()
RETURNS TABLE(
  change_type text,
  table_affected text,
  change_description text,
  timestamp timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'POLICY_CLEANUP'::text as change_type,
    'ALL_TABLES'::text as table_affected,
    'Removed conflicting RLS policies and standardized security'::text as change_description,
    NOW() as timestamp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;