-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.get_service_order_by_share_token(text);
DROP FUNCTION IF EXISTS public.get_company_info_by_share_token(text);
DROP FUNCTION IF EXISTS public.generate_service_order_share_token(uuid);

-- Function to generate share token for a service order
CREATE OR REPLACE FUNCTION public.generate_service_order_share_token(p_service_order_id uuid)
RETURNS TABLE(share_token text, share_url text, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_token text;
  v_expires_at timestamp with time zone;
  v_base_url text := 'https://lovable.app/share/service-order/';
BEGIN
  -- Check if user owns the service order
  IF NOT EXISTS (
    SELECT 1 FROM service_orders 
    WHERE id = p_service_order_id 
    AND owner_id = auth.uid() 
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Acesso negado: você só pode compartilhar suas próprias ordens de serviço';
  END IF;

  -- Set expiration to 30 days from now
  v_expires_at := now() + interval '30 days';

  -- Check if there's already an active share for this service order
  SELECT sos.share_token INTO v_token
  FROM service_order_shares sos
  WHERE sos.service_order_id = p_service_order_id
  AND sos.is_active = true
  AND sos.expires_at > now();

  -- If no active share exists, create a new one
  IF v_token IS NULL THEN
    -- Generate new token
    v_token := gen_random_uuid()::text;
    
    -- Insert new share record
    INSERT INTO service_order_shares (service_order_id, share_token, expires_at, is_active)
    VALUES (p_service_order_id, v_token, v_expires_at, true);
  END IF;

  -- Return the token and URL
  RETURN QUERY SELECT 
    v_token as share_token,
    (v_base_url || v_token) as share_url,
    v_expires_at as expires_at;
END;
$$;

-- Function to get service order by share token
CREATE OR REPLACE FUNCTION public.get_service_order_by_share_token(p_share_token text)
RETURNS TABLE(
  id uuid,
  formatted_id text,
  device_type character varying,
  device_model character varying,
  reported_issue text,
  status character varying,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if share token is valid and active
  IF NOT EXISTS (
    SELECT 1 FROM service_order_shares sos
    WHERE sos.share_token = p_share_token
    AND sos.is_active = true
    AND sos.expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Token de compartilhamento inválido ou expirado';
  END IF;

  -- Return service order data
  RETURN QUERY
  SELECT 
    so.id,
    CONCAT('OS', LPAD(EXTRACT(epoch FROM so.created_at)::text, 10, '0')) as formatted_id,
    so.device_type,
    so.device_model,
    so.reported_issue,
    so.status,
    so.created_at,
    so.updated_at
  FROM service_orders so
  INNER JOIN service_order_shares sos ON so.id = sos.service_order_id
  WHERE sos.share_token = p_share_token
  AND sos.is_active = true
  AND sos.expires_at > now()
  AND so.deleted_at IS NULL;
END;
$$;

-- Function to get company info by share token
CREATE OR REPLACE FUNCTION public.get_company_info_by_share_token(p_share_token text)
RETURNS TABLE(
  name character varying,
  logo_url text,
  address text,
  whatsapp_phone character varying
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if share token is valid
  IF NOT EXISTS (
    SELECT 1 FROM service_order_shares sos
    WHERE sos.share_token = p_share_token
    AND sos.is_active = true
    AND sos.expires_at > now()
  ) THEN
    RETURN;
  END IF;

  -- Return company info for the owner of the shared service order
  RETURN QUERY
  SELECT 
    ci.name,
    ci.logo_url,
    ci.address,
    ci.whatsapp_phone
  FROM company_info ci
  INNER JOIN service_order_shares sos ON ci.owner_id = (
    SELECT so.owner_id 
    FROM service_orders so 
    WHERE so.id = sos.service_order_id
  )
  WHERE sos.share_token = p_share_token
  AND sos.is_active = true
  AND sos.expires_at > now();
END;
$$;

-- Grant permissions for the functions
GRANT EXECUTE ON FUNCTION public.generate_service_order_share_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_service_order_by_share_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_service_order_by_share_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_info_by_share_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_company_info_by_share_token(text) TO authenticated;