-- Fix infinite recursion in service_orders RLS policies
-- Remove all existing policies to start clean
DROP POLICY IF EXISTS "anonymous_access_via_share_token" ON service_orders;
DROP POLICY IF EXISTS "authenticated_users_delete_own_orders" ON service_orders;
DROP POLICY IF EXISTS "authenticated_users_insert_orders" ON service_orders;
DROP POLICY IF EXISTS "authenticated_users_own_orders" ON service_orders;
DROP POLICY IF EXISTS "authenticated_users_update_own_orders" ON service_orders;
DROP POLICY IF EXISTS "service_orders_anonymous_shared_access" ON service_orders;
DROP POLICY IF EXISTS "service_orders_authenticated_delete" ON service_orders;
DROP POLICY IF EXISTS "service_orders_authenticated_insert" ON service_orders;
DROP POLICY IF EXISTS "service_orders_authenticated_own_access" ON service_orders;
DROP POLICY IF EXISTS "service_orders_authenticated_update" ON service_orders;

-- Create a security definer function to check service order access
CREATE OR REPLACE FUNCTION public.can_access_service_order(service_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id uuid;
  order_owner_id uuid;
  has_share_access boolean := false;
BEGIN
  current_user_id := auth.uid();
  
  -- Get the owner of the service order
  SELECT owner_id INTO order_owner_id
  FROM service_orders
  WHERE id = service_order_id;
  
  -- Check if user is the owner
  IF current_user_id = order_owner_id THEN
    RETURN true;
  END IF;
  
  -- Check if user is admin
  IF public.is_current_user_admin() THEN
    RETURN true;
  END IF;
  
  -- Check if there's a valid share token (for anonymous access)
  SELECT EXISTS (
    SELECT 1 FROM service_order_shares sos
    WHERE sos.service_order_id = can_access_service_order.service_order_id
    AND sos.is_active = true
    AND sos.expires_at > now()
  ) INTO has_share_access;
  
  RETURN has_share_access;
END;
$$;

-- Create simplified RLS policies using the security definer function
CREATE POLICY "service_orders_select_policy" ON service_orders
  FOR SELECT
  USING (
    auth.uid() = owner_id 
    OR public.is_current_user_admin()
    OR public.can_access_service_order(id)
  );

CREATE POLICY "service_orders_insert_policy" ON service_orders
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = owner_id
  );

CREATE POLICY "service_orders_update_policy" ON service_orders
  FOR UPDATE
  USING (
    auth.uid() = owner_id 
    OR public.is_current_user_admin()
  )
  WITH CHECK (
    auth.uid() = owner_id 
    OR public.is_current_user_admin()
  );

CREATE POLICY "service_orders_delete_policy" ON service_orders
  FOR DELETE
  USING (
    auth.uid() = owner_id 
    OR public.is_current_user_admin()
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.can_access_service_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_service_order(uuid) TO anon;