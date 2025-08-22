-- Migração para atualizar todas as funções RPC que fazem referência ao campo service_orders_beta_enabled
-- para usar o novo campo service_orders_vip_enabled

-- Atualizar função get_service_orders
CREATE OR REPLACE FUNCTION public.get_service_orders(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_sort_by text DEFAULT 'created_at',
  p_sort_order text DEFAULT 'desc'
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  status text,
  priority text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  owner_id uuid,
  owner_name text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário tem acesso às ordens de serviço VIP
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND (service_orders_vip_enabled = true OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: usuário não tem permissão para acessar ordens de serviço VIP';
  END IF;

  RETURN QUERY
  WITH filtered_orders AS (
    SELECT 
      so.id,
      so.title,
      so.description,
      so.status,
      so.priority,
      so.created_at,
      so.updated_at,
      so.owner_id,
      up.name as owner_name
    FROM service_orders so
    LEFT JOIN user_profiles up ON so.owner_id = up.id
    WHERE 
      (p_status IS NULL OR so.status = p_status)
      AND (p_search IS NULL OR 
           so.title ILIKE '%' || p_search || '%' OR 
           so.description ILIKE '%' || p_search || '%')
      AND (p_start_date IS NULL OR so.created_at::date >= p_start_date)
      AND (p_end_date IS NULL OR so.created_at::date <= p_end_date)
  ),
  total_count_query AS (
    SELECT COUNT(*) as total FROM filtered_orders
  )
  SELECT 
    fo.id,
    fo.title,
    fo.description,
    fo.status,
    fo.priority,
    fo.created_at,
    fo.updated_at,
    fo.owner_id,
    fo.owner_name,
    tc.total
  FROM filtered_orders fo
  CROSS JOIN total_count_query tc
  ORDER BY 
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN fo.created_at END DESC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN fo.created_at END ASC,
    CASE WHEN p_sort_by = 'title' AND p_sort_order = 'desc' THEN fo.title END DESC,
    CASE WHEN p_sort_by = 'title' AND p_sort_order = 'asc' THEN fo.title END ASC,
    CASE WHEN p_sort_by = 'status' AND p_sort_order = 'desc' THEN fo.status END DESC,
    CASE WHEN p_sort_by = 'status' AND p_sort_order = 'asc' THEN fo.status END ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Atualizar função create_service_order
CREATE OR REPLACE FUNCTION public.create_service_order(
  p_title text,
  p_description text,
  p_priority text DEFAULT 'medium'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id uuid;
BEGIN
  -- Verificar se o usuário tem acesso às ordens de serviço VIP
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND (service_orders_vip_enabled = true OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: usuário não tem permissão para criar ordens de serviço VIP';
  END IF;

  INSERT INTO service_orders (title, description, priority, owner_id)
  VALUES (p_title, p_description, p_priority, auth.uid())
  RETURNING id INTO new_order_id;

  RETURN new_order_id;
END;
$$;

-- Atualizar função update_service_order
CREATE OR REPLACE FUNCTION public.update_service_order(
  p_id uuid,
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_priority text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário tem acesso às ordens de serviço VIP
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND (service_orders_vip_enabled = true OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: usuário não tem permissão para atualizar ordens de serviço VIP';
  END IF;

  UPDATE service_orders
  SET 
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    status = COALESCE(p_status, status),
    priority = COALESCE(p_priority, priority),
    updated_at = NOW()
  WHERE id = p_id
    AND (owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ));

  RETURN FOUND;
END;
$$;

-- Atualizar função delete_service_order
CREATE OR REPLACE FUNCTION public.delete_service_order(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário tem acesso às ordens de serviço VIP
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND (service_orders_vip_enabled = true OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: usuário não tem permissão para excluir ordens de serviço VIP';
  END IF;

  UPDATE service_orders
  SET 
    deleted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_id
    AND deleted_at IS NULL
    AND (owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ));

  RETURN FOUND;
END;
$$;

-- Atualizar função get_service_order_by_id
CREATE OR REPLACE FUNCTION public.get_service_order_by_id(p_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  status text,
  priority text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  owner_id uuid,
  owner_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário tem acesso às ordens de serviço VIP
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND (service_orders_vip_enabled = true OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: usuário não tem permissão para acessar ordens de serviço VIP';
  END IF;

  RETURN QUERY
  SELECT 
    so.id,
    so.title,
    so.description,
    so.status,
    so.priority,
    so.created_at,
    so.updated_at,
    so.owner_id,
    up.name as owner_name
  FROM service_orders so
  LEFT JOIN user_profiles up ON so.owner_id = up.id
  WHERE so.id = p_id AND so.deleted_at IS NULL;
END;
$$;

-- Atualizar função get_deleted_service_orders
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
  title text,
  description text,
  status text,
  priority text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  deleted_at timestamp with time zone,
  owner_id uuid,
  owner_name text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
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
      so.title,
      so.description,
      so.status,
      so.priority,
      so.created_at,
      so.updated_at,
      so.deleted_at,
      so.owner_id,
      up.name as owner_name
    FROM service_orders so
    LEFT JOIN user_profiles up ON so.owner_id = up.id
    WHERE 
      so.deleted_at IS NOT NULL
      AND (p_search IS NULL OR 
           so.title ILIKE '%' || p_search || '%' OR 
           so.description ILIKE '%' || p_search || '%')
      AND (p_start_date IS NULL OR so.deleted_at::date >= p_start_date)
      AND (p_end_date IS NULL OR so.deleted_at::date <= p_end_date)
  ),
  total_count_query AS (
    SELECT COUNT(*) as total FROM filtered_orders
  )
  SELECT 
    fo.id,
    fo.title,
    fo.description,
    fo.status,
    fo.priority,
    fo.created_at,
    fo.updated_at,
    fo.deleted_at,
    fo.owner_id,
    fo.owner_name,
    tc.total
  FROM filtered_orders fo
  CROSS JOIN total_count_query tc
  ORDER BY 
    CASE WHEN p_sort_by = 'deleted_at' AND p_sort_order = 'desc' THEN fo.deleted_at END DESC,
    CASE WHEN p_sort_by = 'deleted_at' AND p_sort_order = 'asc' THEN fo.deleted_at END ASC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN fo.created_at END DESC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN fo.created_at END ASC,
    CASE WHEN p_sort_by = 'title' AND p_sort_order = 'desc' THEN fo.title END DESC,
    CASE WHEN p_sort_by = 'title' AND p_sort_order = 'asc' THEN fo.title END ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Atualizar as políticas RLS da tabela service_orders para usar o novo campo
DROP POLICY IF EXISTS "Users can view service orders if they have VIP access" ON service_orders;
CREATE POLICY "Users can view service orders if they have VIP access" ON service_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND (service_orders_vip_enabled = true OR public.is_current_user_admin())
    )
  );