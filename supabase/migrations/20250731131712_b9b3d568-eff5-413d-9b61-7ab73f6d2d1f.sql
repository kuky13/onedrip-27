-- FASE 2: CORRIGIR FUNÇÕES RESTANTES E IMPLEMENTAR TRILHA DE AUDITORIA
-- =======================================================================

-- 1. CORRIGIR SEARCH_PATH DAS FUNÇÕES RESTANTES
-- =============================================

-- Corrigir funções de budgets
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
    b.id, b.client_name, b.client_phone, b.device_type, b.device_model,
    b.issue, b.part_quality, b.status, b.workflow_status, b.total_price,
    b.cash_price, b.installment_price, b.delivery_date, b.expires_at,
    b.valid_until, b.created_at, b.updated_at, b.is_paid, b.is_delivered
  FROM public.budgets b
  WHERE b.owner_id = p_user_id 
    AND b.deleted_at IS NULL
    AND (p_search_term IS NULL OR 
         b.client_name ILIKE '%' || p_search_term || '%' OR
         b.client_phone ILIKE '%' || p_search_term || '%' OR
         b.device_model ILIKE '%' || p_search_term || '%')
    AND (p_status_filter IS NULL OR b.workflow_status = p_status_filter)
  ORDER BY b.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Corrigir função de métricas administrativas
DROP FUNCTION IF EXISTS public.admin_get_user_metrics(uuid);

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

-- Corrigir função de log de ações administrativas
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
    admin_user_id, target_user_id, action, details
  ) VALUES (
    auth.uid(), p_target_user_id, p_action, p_details
  );
END;
$$;

-- Corrigir todas as outras funções críticas
CREATE OR REPLACE FUNCTION public.set_budget_expiration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := CURRENT_DATE + INTERVAL '15 days';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_top_rankings()
RETURNS TABLE(id uuid, user_name text, score integer, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH ranked_scores AS (
    SELECT 
      ri.id, up.name as user_name, ri.score, ri.created_at,
      ROW_NUMBER() OVER (PARTITION BY ri.user_id ORDER BY ri.score DESC, ri.created_at ASC) as rn
    FROM public.ranking_invaders ri
    INNER JOIN public.user_profiles up ON ri.user_id = up.id
    WHERE up.is_active = true
  )
  SELECT ranked_scores.id, ranked_scores.user_name, ranked_scores.score, ranked_scores.created_at
  FROM ranked_scores
  WHERE rn = 1
  ORDER BY score DESC, created_at ASC
  LIMIT 10;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_deleted_budgets()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Deletar permanentemente orçamentos excluídos há mais de 90 dias
  WITH deleted_budgets AS (
    DELETE FROM public.budgets 
    WHERE deleted_at < (now() - INTERVAL '90 days')
    RETURNING id
  )
  SELECT COUNT(*) INTO cleanup_count FROM deleted_budgets;

  -- Marcar registros de auditoria como não restauráveis
  UPDATE public.budget_deletion_audit
  SET can_restore = false
  WHERE created_at < (now() - INTERVAL '90 days') AND can_restore = true;

  RETURN cleanup_count;
END;
$$;