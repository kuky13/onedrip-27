-- AUDITORIA E CORREÇÃO DE SEGURANÇA - FASE 3: CORREÇÃO DOS ÍNDICES E FUNÇÕES RESTANTES

-- Criar índices otimizados sem CONCURRENTLY (dentro da transação)
CREATE INDEX IF NOT EXISTS idx_budgets_performance_query 
ON public.budgets (owner_id, deleted_at, workflow_status, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_budget_parts_performance 
ON public.budget_parts (budget_id, deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_logs_security_events 
ON public.admin_logs (action, created_at DESC) 
WHERE action LIKE 'SECURITY_EVENT:%';

-- Função para limpeza automática de logs antigos (performance)
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

-- Função para auditoria de RLS - verificar integridade das políticas
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

-- Função para detectar tentativas de SQL injection
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

-- Função otimizada para busca de orçamentos (substituindo queries complexas)
CREATE OR REPLACE FUNCTION public.get_optimized_budgets(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_search_term TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  client_name TEXT,
  client_phone TEXT,
  device_type TEXT,
  device_model TEXT,
  total_price NUMERIC,
  workflow_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.client_name,
    b.client_phone,
    b.device_type,
    b.device_model,
    b.total_price,
    b.workflow_status,
    b.created_at,
    b.updated_at
  FROM public.budgets b
  WHERE b.owner_id = p_user_id
    AND b.deleted_at IS NULL
    AND (
      p_search_term IS NULL 
      OR b.search_vector @@ plainto_tsquery('portuguese', p_search_term)
      OR b.client_name ILIKE '%' || p_search_term || '%'
      OR b.device_model ILIKE '%' || p_search_term || '%'
    )
  ORDER BY b.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;