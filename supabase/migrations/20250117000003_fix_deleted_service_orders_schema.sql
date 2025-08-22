-- Corrigir função get_deleted_service_orders para retornar os campos corretos da tabela service_orders
-- A migração anterior estava retornando campos genéricos (title, description) em vez dos campos específicos

CREATE OR REPLACE FUNCTION public.get_deleted_service_orders(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_sort_by text DEFAULT 'deleted_at',
  p_sort_order text DEFAULT 'desc'
)
RETURNS TABLE(
  id uuid,
  owner_id uuid,
  client_id uuid,
  device_type character varying,
  device_model character varying,
  imei_serial character varying,
  reported_issue text,
  status character varying,
  priority character varying,
  total_price numeric,
  labor_cost numeric,
  parts_cost numeric,
  is_paid boolean,
  delivery_date timestamp with time zone,
  warranty_months integer,
  notes text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verificar se o usuário tem acesso às ordens de serviço VIP
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND (user_profiles.service_orders_vip_enabled = true OR user_profiles.role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: usuário não tem permissão para acessar ordens de serviço VIP';
  END IF;

  RETURN QUERY
  WITH filtered_orders AS (
    SELECT 
      so.id,
      so.owner_id,
      so.client_id,
      so.device_type,
      so.device_model,
      so.imei_serial,
      so.reported_issue,
      so.status,
      so.priority,
      so.total_price,
      so.labor_cost,
      so.parts_cost,
      so.is_paid,
      so.delivery_date,
      so.warranty_months,
      so.notes,
      so.created_at,
      so.updated_at,
      so.deleted_at,
      so.deleted_by
    FROM service_orders so
    WHERE 
      so.deleted_at IS NOT NULL
      AND (
        (so.owner_id = auth.uid()) OR 
        public.is_current_user_admin()
      )
      AND (p_search IS NULL OR 
           so.device_type ILIKE '%' || p_search || '%' OR 
           so.device_model ILIKE '%' || p_search || '%' OR
           so.imei_serial ILIKE '%' || p_search || '%' OR
           so.reported_issue ILIKE '%' || p_search || '%')
      AND (p_start_date IS NULL OR so.deleted_at::date >= p_start_date)
      AND (p_end_date IS NULL OR so.deleted_at::date <= p_end_date)
  ),
  total_count_query AS (
    SELECT COUNT(*) as total FROM filtered_orders
  )
  SELECT 
    fo.id,
    fo.owner_id,
    fo.client_id,
    fo.device_type,
    fo.device_model,
    fo.imei_serial,
    fo.reported_issue,
    fo.status,
    fo.priority,
    fo.total_price,
    fo.labor_cost,
    fo.parts_cost,
    fo.is_paid,
    fo.delivery_date,
    fo.warranty_months,
    fo.notes,
    fo.created_at,
    fo.updated_at,
    fo.deleted_at,
    fo.deleted_by,
    tc.total
  FROM filtered_orders fo
  CROSS JOIN total_count_query tc
  ORDER BY 
    CASE WHEN p_sort_by = 'deleted_at' AND p_sort_order = 'desc' THEN fo.deleted_at END DESC,
    CASE WHEN p_sort_by = 'deleted_at' AND p_sort_order = 'asc' THEN fo.deleted_at END ASC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN fo.created_at END DESC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN fo.created_at END ASC,
    CASE WHEN p_sort_by = 'device_type' AND p_sort_order = 'desc' THEN fo.device_type END DESC,
    CASE WHEN p_sort_by = 'device_type' AND p_sort_order = 'asc' THEN fo.device_type END ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.get_deleted_service_orders TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION public.get_deleted_service_orders IS 'Retorna ordens de serviço deletadas com os campos específicos da tabela service_orders (device_type, device_model, etc.) em vez de campos genéricos (title, description)';