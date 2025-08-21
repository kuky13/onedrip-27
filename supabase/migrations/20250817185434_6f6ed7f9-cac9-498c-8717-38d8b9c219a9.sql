-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_service_order_by_share_token(text);

-- Function to get service order by share token
CREATE OR REPLACE FUNCTION public.get_service_order_by_share_token(p_share_token TEXT)
RETURNS TABLE(
  id UUID,
  formatted_id TEXT,
  device_type TEXT,
  device_model TEXT,
  reported_issue TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if token exists and is not expired
  IF NOT EXISTS (
    SELECT 1 FROM public.service_order_share_tokens 
    WHERE share_token = p_share_token 
    AND expires_at > NOW()
  ) THEN
    RAISE EXCEPTION 'Invalid or expired share token';
  END IF;

  -- Return service order data
  RETURN QUERY
  SELECT 
    so.id,
    'OS-' || LPAD(EXTRACT(EPOCH FROM so.created_at)::TEXT, 10, '0') as formatted_id,
    so.device_type,
    so.device_model,
    so.reported_issue,
    so.status,
    so.created_at,
    so.updated_at
  FROM public.service_orders so
  INNER JOIN public.service_order_share_tokens st 
    ON st.service_order_id = so.id
  WHERE st.share_token = p_share_token
    AND st.expires_at > NOW()
    AND so.deleted_at IS NULL;
END;
$$;