-- AUDITORIA E CORREÇÃO DE SEGURANÇA - FASE 2: CORREÇÃO DAS FUNÇÕES RESTANTES

-- Corrigir todas as funções restantes com search_path vulnerável

-- 8. Corrigir função log_admin_action
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_target_user_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verificar se é admin antes de logar
  IF NOT public.is_current_user_admin() THEN
    RETURN;
  END IF;
  
  INSERT INTO public.admin_logs (
    admin_user_id,
    target_user_id,
    action,
    details,
    created_at
  ) VALUES (
    auth.uid(),
    p_target_user_id,
    p_action,
    p_details,
    NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log de erro sem quebrar funcionalidade
    RAISE WARNING 'Erro ao registrar log admin: %', SQLERRM;
END;
$$;

-- 9. Corrigir função ensure_client_user_id
CREATE OR REPLACE FUNCTION public.ensure_client_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- Validar que o usuário só pode criar clientes para si mesmo
  IF NEW.user_id != auth.uid() AND NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: usuário só pode criar clientes para si mesmo';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 10. Adicionar índices otimizados para performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budgets_performance_query 
ON public.budgets (owner_id, deleted_at, workflow_status, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budget_parts_performance 
ON public.budget_parts (budget_id, deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_logs_security_events 
ON public.admin_logs (action, created_at DESC) 
WHERE action LIKE 'SECURITY_EVENT:%';

-- 11. Função para limpeza automática de logs antigos (performance)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Manter apenas 90 dias de logs
  DELETE FROM public.admin_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- 12. Função para auditoria de RLS - verificar integridade das políticas
CREATE OR REPLACE FUNCTION public.audit_rls_policies()
RETURNS TABLE(
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count BIGINT,
  security_status TEXT,
  recommendations TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity,
    COALESCE(COUNT(p.policyname), 0),
    CASE 
      WHEN t.rowsecurity AND COUNT(p.policyname) > 0 THEN 'SEGURO'
      WHEN t.rowsecurity AND COUNT(p.policyname) = 0 THEN 'RLS SEM POLÍTICAS'
      ELSE 'VULNERÁVEL - RLS DESABILITADO'
    END::TEXT,
    CASE 
      WHEN NOT t.rowsecurity THEN 'Ativar RLS na tabela'
      WHEN t.rowsecurity AND COUNT(p.policyname) = 0 THEN 'Adicionar políticas RLS'
      ELSE 'Configuração segura'
    END::TEXT
  FROM pg_tables t
  LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
  WHERE t.schemaname = 'public'
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY 
    CASE 
      WHEN NOT t.rowsecurity THEN 1
      WHEN t.rowsecurity AND COUNT(p.policyname) = 0 THEN 2
      ELSE 3
    END,
    t.tablename;
END;
$$;

-- 13. Função para detectar tentativas de SQL injection
CREATE OR REPLACE FUNCTION public.detect_sql_injection(input_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  dangerous_patterns TEXT[] := ARRAY[
    'union\s+select',
    'drop\s+table',
    'delete\s+from',
    'insert\s+into',
    'update\s+.*set',
    'alter\s+table',
    'create\s+table',
    '--',
    '/\*',
    'xp_',
    'sp_',
    'exec\s*\(',
    'script\s*>'
  ];
  pattern TEXT;
BEGIN
  IF input_text IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Converter para minúsculas para verificação
  input_text := LOWER(input_text);
  
  -- Verificar cada padrão perigoso
  FOREACH pattern IN ARRAY dangerous_patterns
  LOOP
    IF input_text ~* pattern THEN
      -- Log tentativa de SQL injection
      PERFORM public.log_security_event(
        'SQL_INJECTION_ATTEMPT',
        auth.uid(),
        JSONB_BUILD_OBJECT('pattern', pattern, 'input', LEFT(input_text, 100))
      );
      RETURN TRUE;
    END IF;
  END LOOP;
  
  RETURN FALSE;
END;
$$;