-- Create service order share tokens table
CREATE TABLE IF NOT EXISTS public.service_order_share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.service_order_share_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own share tokens" 
ON public.service_order_share_tokens 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.service_orders so
    WHERE so.id = service_order_share_tokens.service_order_id
    AND so.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create share tokens for their orders" 
ON public.service_order_share_tokens 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_orders so
    WHERE so.id = service_order_share_tokens.service_order_id
    AND so.owner_id = auth.uid()
  )
);

-- Function to generate share token
CREATE OR REPLACE FUNCTION public.generate_service_order_share_token(p_service_order_id UUID)
RETURNS TABLE(
  share_token TEXT,
  share_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token TEXT;
  token_exists BOOLEAN := TRUE;
  base_url TEXT := 'https://lovable.app/share/service-order/';
BEGIN
  -- Check if user owns the service order
  IF NOT EXISTS (
    SELECT 1 FROM public.service_orders 
    WHERE id = p_service_order_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Service order not found or access denied';
  END IF;

  -- Generate unique token
  WHILE token_exists LOOP
    new_token := encode(gen_random_bytes(16), 'hex');
    
    SELECT EXISTS (
      SELECT 1 FROM public.service_order_share_tokens 
      WHERE share_token = new_token
    ) INTO token_exists;
  END LOOP;

  -- Delete existing tokens for this service order
  DELETE FROM public.service_order_share_tokens
  WHERE service_order_id = p_service_order_id;

  -- Insert new token
  INSERT INTO public.service_order_share_tokens (service_order_id, share_token, expires_at)
  VALUES (p_service_order_id, new_token, NOW() + INTERVAL '7 days');

  -- Return token data
  RETURN QUERY
  SELECT 
    new_token,
    base_url || new_token,
    (NOW() + INTERVAL '7 days')::TIMESTAMP WITH TIME ZONE;
END;
$$;

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

-- Function to get company info by share token
CREATE OR REPLACE FUNCTION public.get_company_info_by_share_token(p_share_token TEXT)
RETURNS TABLE(
  name TEXT,
  logo_url TEXT,
  address TEXT,
  whatsapp_phone TEXT
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

  -- Return company info for the service order owner
  RETURN QUERY
  SELECT 
    ci.name,
    ci.logo_url,
    ci.address,
    ci.whatsapp_phone
  FROM public.service_order_share_tokens st
  INNER JOIN public.service_orders so ON st.service_order_id = so.id
  INNER JOIN public.company_info ci ON ci.owner_id = so.owner_id
  WHERE st.share_token = p_share_token
    AND st.expires_at > NOW()
    AND so.deleted_at IS NULL;
END;
$$;