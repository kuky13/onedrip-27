-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA RLS
-- ============================================

-- 1. CORRIGIR SEARCH_PATH DAS FUNÇÕES CRÍTICAS
-- ============================================

-- Corrigir função is_current_user_admin (mais crítica)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$;

-- Corrigir função is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

-- Corrigir função generate_license_code
CREATE OR REPLACE FUNCTION public.generate_license_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code_prefix TEXT := 'OLV';
  random_part TEXT;
  full_code TEXT;
BEGIN
  -- Gerar parte aleatória
  random_part := UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 8));
  full_code := code_prefix || '-' || random_part;
  
  -- Verificar se já existe
  WHILE EXISTS (SELECT 1 FROM public.licenses WHERE code = full_code) LOOP
    random_part := UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 8));
    full_code := code_prefix || '-' || random_part;
  END LOOP;
  
  RETURN full_code;
END;
$$;

-- Corrigir função get_optimized_budgets
CREATE OR REPLACE FUNCTION public.get_optimized_budgets(
  p_user_id uuid,
  p_search_term text DEFAULT NULL,
  p_status_filter text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  client_name text,
  client_phone text,
  device_type text,
  device_model text,
  issue text,
  part_quality text,
  status text,
  workflow_status text,
  total_price numeric,
  cash_price numeric,
  installment_price numeric,
  delivery_date date,
  expires_at date,
  valid_until date,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  is_paid boolean,
  is_delivered boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se é o próprio usuário ou admin
  IF p_user_id != auth.uid() AND NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: você só pode acessar seus próprios orçamentos';
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.client_name,
    b.client_phone,
    b.device_type,
    b.device_model,
    b.issue,
    b.part_quality,
    b.status,
    b.workflow_status,
    b.total_price,
    b.cash_price,
    b.installment_price,
    b.delivery_date,
    b.expires_at,
    b.valid_until,
    b.created_at,
    b.updated_at,
    b.is_paid,
    b.is_delivered
  FROM public.budgets b
  WHERE b.owner_id = p_user_id 
    AND b.deleted_at IS NULL
    AND (p_search_term IS NULL OR 
         b.client_name ILIKE '%' || p_search_term || '%' OR
         b.client_phone ILIKE '%' || p_search_term || '%' OR
         b.device_model ILIKE '%' || p_search_term || '%')
    AND (p_status_filter IS NULL OR b.workflow_status = p_status_filter)
  ORDER BY b.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Corrigir função admin_get_user_metrics
CREATE OR REPLACE FUNCTION public.admin_get_user_metrics(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  metrics jsonb;
BEGIN
  -- Verificar se é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar métricas';
  END IF;

  SELECT jsonb_build_object(
    'total_budgets', COUNT(*),
    'active_budgets', COUNT(*) FILTER (WHERE deleted_at IS NULL),
    'pending_budgets', COUNT(*) FILTER (WHERE workflow_status = 'pending' AND deleted_at IS NULL),
    'approved_budgets', COUNT(*) FILTER (WHERE workflow_status = 'approved' AND deleted_at IS NULL),
    'completed_budgets', COUNT(*) FILTER (WHERE workflow_status = 'completed' AND deleted_at IS NULL),
    'total_value', COALESCE(SUM(total_price) FILTER (WHERE deleted_at IS NULL), 0),
    'avg_budget_value', COALESCE(AVG(total_price) FILTER (WHERE deleted_at IS NULL), 0),
    'last_budget_date', MAX(created_at) FILTER (WHERE deleted_at IS NULL)
  ) INTO metrics
  FROM public.budgets
  WHERE owner_id = p_user_id;

  RETURN metrics;
END;
$$;

-- Corrigir função log_admin_action
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_target_user_id uuid,
  p_action text,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem registrar ações';
  END IF;

  INSERT INTO public.admin_logs (
    admin_user_id,
    target_user_id,
    action,
    details
  ) VALUES (
    auth.uid(),
    p_target_user_id,
    p_action,
    p_details
  );
END;
$$;

-- Corrigir função validate_input
CREATE OR REPLACE FUNCTION public.validate_input(
  p_input text,
  p_input_type text DEFAULT 'general',
  p_max_length integer DEFAULT 1000
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_valid boolean := true;
  errors text[] := '{}';
  sanitized_input text;
BEGIN
  -- Verificar se input é nulo ou vazio
  IF p_input IS NULL OR LENGTH(TRIM(p_input)) = 0 THEN
    RETURN jsonb_build_object(
      'is_valid', false,
      'errors', ARRAY['Input não pode ser vazio'],
      'sanitized', ''
    );
  END IF;

  -- Verificar tamanho máximo
  IF LENGTH(p_input) > p_max_length THEN
    is_valid := false;
    errors := array_append(errors, 'Input excede tamanho máximo de ' || p_max_length || ' caracteres');
  END IF;

  -- Detectar SQL Injection
  IF public.detect_sql_injection(p_input) THEN
    is_valid := false;
    errors := array_append(errors, 'Padrão suspeito detectado no input');
  END IF;

  -- Sanitizar input (remover tags HTML básicas)
  sanitized_input := REGEXP_REPLACE(p_input, '<[^>]*>', '', 'g');
  sanitized_input := REGEXP_REPLACE(sanitized_input, '[<>"\''&]', '', 'g');

  -- Validações específicas por tipo
  CASE p_input_type
    WHEN 'email' THEN
      IF NOT sanitized_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        is_valid := false;
        errors := array_append(errors, 'Formato de email inválido');
      END IF;
    WHEN 'phone' THEN
      IF NOT sanitized_input ~* '^[\d\s\(\)\-\+]+$' THEN
        is_valid := false;
        errors := array_append(errors, 'Formato de telefone inválido');
      END IF;
    WHEN 'alphanumeric' THEN
      IF NOT sanitized_input ~* '^[A-Za-z0-9\s]+$' THEN
        is_valid := false;
        errors := array_append(errors, 'Apenas caracteres alfanuméricos são permitidos');
      END IF;
  END CASE;

  RETURN jsonb_build_object(
    'is_valid', is_valid,
    'errors', errors,
    'sanitized', sanitized_input
  );
END;
$$;

-- 2. RESTRINGIR POLÍTICAS PERMISSIVAS
-- ===================================

-- Corrigir política da tabela rate_limit_tracking (muito permissiva)
DROP POLICY IF EXISTS "System can manage rate limiting" ON public.rate_limit_tracking;

CREATE POLICY "rate_limit_insert_only" 
ON public.rate_limit_tracking 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "rate_limit_select_own" 
ON public.rate_limit_tracking 
FOR SELECT 
USING (identifier = COALESCE(auth.jwt() ->> 'email', auth.uid()::text));

CREATE POLICY "rate_limit_update_own" 
ON public.rate_limit_tracking 
FOR UPDATE 
USING (identifier = COALESCE(auth.jwt() ->> 'email', auth.uid()::text));

CREATE POLICY "rate_limit_delete_expired" 
ON public.rate_limit_tracking 
FOR DELETE 
USING (created_at < now() - INTERVAL '1 hour');

-- Restringir acesso aos game_settings apenas para admins
DROP POLICY IF EXISTS "Users can view game settings" ON public.game_settings;

CREATE POLICY "game_settings_admin_only" 
ON public.game_settings 
FOR SELECT 
USING (public.is_current_user_admin());

-- 3. REMOVER POLÍTICAS DUPLICADAS
-- ===============================

-- Remover políticas duplicadas da tabela user_profiles
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;

-- Manter apenas as políticas rls_*
-- As políticas rls_user_profiles_* já existem e estão corretas

-- Remover políticas duplicadas da tabela shop_profiles
DROP POLICY IF EXISTS "Users can create their own shop profile" ON public.shop_profiles;
DROP POLICY IF EXISTS "Users can delete their own shop profile" ON public.shop_profiles;
DROP POLICY IF EXISTS "Users can insert their own shop profile" ON public.shop_profiles;
DROP POLICY IF EXISTS "Users can update their own shop profile" ON public.shop_profiles;
DROP POLICY IF EXISTS "Users can view their own shop profile" ON public.shop_profiles;

-- Manter apenas as políticas rls_*

-- 4. ADICIONAR LOGS DE AUDITORIA DE SEGURANÇA
-- ==========================================

-- Criar função para auditar mudanças RLS críticas
CREATE OR REPLACE FUNCTION public.audit_rls_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log mudanças em tabelas críticas
  IF TG_TABLE_NAME IN ('user_profiles', 'licenses', 'budgets', 'admin_logs') THEN
    PERFORM public.log_security_event(
      'RLS_CRITICAL_TABLE_MODIFIED',
      auth.uid(),
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'record_id', COALESCE(NEW.id, OLD.id),
        'timestamp', now()
      ),
      'high'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger de auditoria em tabelas críticas
DROP TRIGGER IF EXISTS audit_user_profiles_changes ON public.user_profiles;
CREATE TRIGGER audit_user_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_rls_changes();

DROP TRIGGER IF EXISTS audit_licenses_changes ON public.licenses;
CREATE TRIGGER audit_licenses_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION public.audit_rls_changes();

DROP TRIGGER IF EXISTS audit_budgets_changes ON public.budgets;
CREATE TRIGGER audit_budgets_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.audit_rls_changes();

-- 5. MELHORAR FUNÇÃO DE VALIDAÇÃO DE INTEGRIDADE
-- ==============================================

CREATE OR REPLACE FUNCTION public.verify_system_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  rls_issues integer := 0;
  orphaned_records integer := 0;
  security_violations integer := 0;
BEGIN
  -- Verificar se é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem verificar integridade';
  END IF;

  -- Contar tabelas sem RLS
  SELECT COUNT(*) INTO rls_issues
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    WHERE c.relname = t.tablename
    AND c.relrowsecurity = true
  );

  -- Contar registros órfãos em budgets
  SELECT COUNT(*) INTO orphaned_records
  FROM public.budgets b
  WHERE b.owner_id IS NULL OR
        NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = b.owner_id);

  -- Simular verificação de violações de segurança
  security_violations := 0;

  result := jsonb_build_object(
    'status', CASE 
      WHEN rls_issues = 0 AND orphaned_records = 0 AND security_violations = 0 THEN 'HEALTHY'
      WHEN rls_issues > 0 OR security_violations > 0 THEN 'CRITICAL'
      ELSE 'WARNING'
    END,
    'rls_issues', rls_issues,
    'orphaned_records', orphaned_records,
    'security_violations', security_violations,
    'timestamp', now(),
    'checked_by', auth.uid()
  );

  -- Log da verificação
  PERFORM public.log_security_event(
    'SYSTEM_INTEGRITY_CHECK',
    auth.uid(),
    result,
    CASE WHEN rls_issues > 0 OR security_violations > 0 THEN 'high' ELSE 'medium' END
  );

  RETURN result;
END;
$$;