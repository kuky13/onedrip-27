-- Service Orders Trash System
-- Functions for managing soft-deleted service orders (trash/recycle bin)

-- Function to get all soft-deleted service orders (trash)
CREATE OR REPLACE FUNCTION get_deleted_service_orders()
RETURNS TABLE (
  id UUID,
  owner_id UUID,
  client_id UUID,
  device_type VARCHAR(100),
  device_model VARCHAR(100),
  imei_serial VARCHAR(50),
  reported_issue TEXT,
  status VARCHAR(20),
  priority VARCHAR(10),
  total_price DECIMAL(10,2),
  labor_cost DECIMAL(10,2),
  parts_cost DECIMAL(10,2),
  is_paid BOOLEAN,
  delivery_date TIMESTAMPTZ,
  warranty_months INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has access to Service Orders module
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR 'Service Orders (Beta)' = ANY(modules))
  ) THEN
    RAISE EXCEPTION 'Access denied. User does not have permission to access Service Orders module.';
  END IF;

  RETURN QUERY
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
  WHERE so.deleted_at IS NOT NULL
  ORDER BY so.deleted_at DESC;
END;
$$;

-- Function to permanently delete a service order (hard delete)
CREATE OR REPLACE FUNCTION hard_delete_service_order(service_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  order_exists BOOLEAN;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  -- Validate user ID
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check if user has access to Service Orders module
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id 
    AND (role = 'admin' OR 'Service Orders (Beta)' = ANY(modules))
  ) THEN
    RAISE EXCEPTION 'Access denied. User does not have permission to access Service Orders module.';
  END IF;

  -- Validate service order ID
  IF service_order_id IS NULL THEN
    RAISE EXCEPTION 'Service order ID cannot be null';
  END IF;

  -- Check if service order exists and is soft-deleted
  SELECT EXISTS(
    SELECT 1 FROM service_orders 
    WHERE id = service_order_id AND deleted_at IS NOT NULL
  ) INTO order_exists;

  IF NOT order_exists THEN
    RAISE EXCEPTION 'Service order not found in trash or does not exist';
  END IF;

  -- Delete related records first (service_order_events)
  DELETE FROM service_order_events WHERE service_order_id = service_order_id;

  -- Permanently delete the service order
  DELETE FROM service_orders WHERE id = service_order_id;

  -- Log the hard delete event (if the events table still exists)
  -- Note: This will be in a separate audit log if needed
  
  RETURN TRUE;
END;
$$;

-- Function to empty trash (permanently delete all soft-deleted service orders)
CREATE OR REPLACE FUNCTION empty_service_orders_trash()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  deleted_count INTEGER;
  order_ids UUID[];
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  -- Validate user ID
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check if user has access to Service Orders module and is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Only administrators can empty the trash.';
  END IF;

  -- Get all soft-deleted service order IDs
  SELECT array_agg(id) INTO order_ids
  FROM service_orders 
  WHERE deleted_at IS NOT NULL;

  -- If no orders to delete, return 0
  IF order_ids IS NULL THEN
    RETURN 0;
  END IF;

  -- Delete related records first (service_order_events)
  DELETE FROM service_order_events 
  WHERE service_order_id = ANY(order_ids);

  -- Permanently delete all soft-deleted service orders
  DELETE FROM service_orders 
  WHERE deleted_at IS NOT NULL;

  -- Get the count of deleted records
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_deleted_service_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION hard_delete_service_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION empty_service_orders_trash() TO authenticated;