-- Fix get_deleted_service_orders function
-- Drop and recreate with correct column structure

-- Drop the existing function
DROP FUNCTION IF EXISTS get_deleted_service_orders();

-- Recreate function with correct column structure matching service_orders table
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
    WHERE user_profiles.id = auth.uid() 
    AND (user_profiles.service_orders_beta_enabled = true OR user_profiles.role = 'admin')
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_deleted_service_orders() TO authenticated;