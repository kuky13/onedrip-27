-- Verify and enhance RLS policies for service_orders to ensure proper access control

-- Check current RLS status (should already be enabled)
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

-- Ensure proper function exists for checking access
CREATE OR REPLACE FUNCTION public.can_access_service_order(order_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if order exists and is accessible via share token
  RETURN EXISTS (
    SELECT 1 FROM service_order_shares sos
    JOIN service_orders so ON so.id = sos.service_order_id
    WHERE sos.is_active = true 
    AND sos.expires_at > now()
    AND so.id = order_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Verify the main service_orders policies are correct
-- (These should already exist but let's ensure they're properly configured)

-- Create policy for service order selection with proper access control
DROP POLICY IF EXISTS "service_orders_select_policy" ON service_orders;
CREATE POLICY "service_orders_select_policy" ON service_orders
FOR SELECT USING (
  -- User can see their own orders
  (auth.uid() = owner_id) 
  OR 
  -- Admin can see all orders
  public.is_current_user_admin() 
  OR 
  -- Public can access via valid share token
  public.can_access_service_order(id)
);

-- Ensure insert policy restricts to authenticated users creating their own orders
DROP POLICY IF EXISTS "service_orders_insert_policy" ON service_orders;
CREATE POLICY "service_orders_insert_policy" ON service_orders
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = owner_id
);

-- Ensure update policy restricts to owner or admin
DROP POLICY IF EXISTS "service_orders_update_policy" ON service_orders;
CREATE POLICY "service_orders_update_policy" ON service_orders
FOR UPDATE USING (
  (auth.uid() = owner_id) OR public.is_current_user_admin()
)
WITH CHECK (
  (auth.uid() = owner_id) OR public.is_current_user_admin()
);

-- Ensure delete policy restricts to owner or admin
DROP POLICY IF EXISTS "service_orders_delete_policy" ON service_orders;
CREATE POLICY "service_orders_delete_policy" ON service_orders
FOR DELETE USING (
  (auth.uid() = owner_id) OR public.is_current_user_admin()
);

-- Add missing RPC functions for secure share access
CREATE OR REPLACE FUNCTION public.get_service_order_by_share_token(p_share_token text)
RETURNS TABLE(
  id uuid,
  formatted_id text,
  device_type varchar,
  device_model varchar,
  reported_issue text,
  status varchar,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  -- Validate share token exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM service_order_shares 
    WHERE share_token = p_share_token 
    AND is_active = true 
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Invalid or expired share token';
  END IF;

  -- Return service order data
  RETURN QUERY
  SELECT 
    so.id,
    ('OS-' || UPPER(SUBSTRING(so.id::text FROM 1 FOR 8))) as formatted_id,
    so.device_type,
    so.device_model,
    so.reported_issue,
    so.status::varchar,
    so.created_at,
    so.updated_at
  FROM service_orders so
  JOIN service_order_shares sos ON so.id = sos.service_order_id
  WHERE sos.share_token = p_share_token
    AND sos.is_active = true
    AND sos.expires_at > now()
    AND so.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_company_info_by_share_token(p_share_token text)
RETURNS TABLE(
  name varchar,
  logo_url text,
  address text,
  whatsapp_phone varchar
) AS $$
BEGIN
  -- Validate share token exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM service_order_shares 
    WHERE share_token = p_share_token 
    AND is_active = true 
    AND expires_at > now()
  ) THEN
    RETURN;
  END IF;

  -- Return company info for the order owner
  RETURN QUERY
  SELECT 
    ci.name,
    ci.logo_url,
    ci.address,
    ci.whatsapp_phone
  FROM service_orders so
  JOIN service_order_shares sos ON so.id = sos.service_order_id
  LEFT JOIN company_info ci ON ci.owner_id = so.owner_id
  WHERE sos.share_token = p_share_token
    AND sos.is_active = true
    AND sos.expires_at > now()
    AND so.deleted_at IS NULL
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to generate share tokens securely
CREATE OR REPLACE FUNCTION public.generate_service_order_share_token(p_service_order_id uuid)
RETURNS TABLE(
  share_token text,
  share_url text,
  expires_at timestamptz
) AS $$
DECLARE
  v_token text;
  v_expires_at timestamptz;
  v_base_url text := 'https://cd988252-7718-4f82-bc4d-a6a0d32059ac.lovableproject.com';
BEGIN
  -- Check if user owns the service order
  IF NOT EXISTS (
    SELECT 1 FROM service_orders 
    WHERE id = p_service_order_id 
    AND owner_id = auth.uid()
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Service order not found or access denied';
  END IF;

  -- Generate new token or return existing active one
  SELECT sos.share_token, sos.expires_at INTO v_token, v_expires_at
  FROM service_order_shares sos
  WHERE sos.service_order_id = p_service_order_id
    AND sos.is_active = true
    AND sos.expires_at > now();

  -- If no active token exists, create new one
  IF v_token IS NULL THEN
    v_token := gen_random_uuid()::text;
    v_expires_at := now() + interval '30 days';
    
    -- Deactivate any existing tokens for this order
    UPDATE service_order_shares 
    SET is_active = false 
    WHERE service_order_id = p_service_order_id;
    
    -- Insert new token
    INSERT INTO service_order_shares (service_order_id, share_token, expires_at, is_active)
    VALUES (p_service_order_id, v_token, v_expires_at, true);
  END IF;

  -- Return token data
  RETURN QUERY
  SELECT 
    v_token,
    v_base_url || '/share/service-order/' || v_token,
    v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;