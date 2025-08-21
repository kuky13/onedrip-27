-- Corrigir função admin_create_bulk_licenses com ambiguidade de coluna
CREATE OR REPLACE FUNCTION public.admin_create_bulk_licenses(p_quantity integer, p_expires_in_days integer DEFAULT 365)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_codes TEXT[] := '{}';
  i INTEGER;
  new_code TEXT;
BEGIN
  -- Verificar se é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem criar licenças em lote';
  END IF;
  
  -- Criar licenças
  FOR i IN 1..p_quantity LOOP
    SELECT public.generate_license_code() INTO new_code;
    
    INSERT INTO public.licenses (code, expires_at)
    VALUES (new_code, NOW() + (p_expires_in_days || ' days')::INTERVAL);
    
    new_codes := array_append(new_codes, new_code);
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'codes', new_codes,
    'quantity', p_quantity,
    'expires_in_days', p_expires_in_days
  );
END;
$function$;

-- Corrigir função admin_create_license também
CREATE OR REPLACE FUNCTION public.admin_create_license(p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_code TEXT;
  license_id UUID;
BEGIN
  -- Verificar se é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem criar licenças';
  END IF;
  
  -- Gerar código único
  SELECT public.generate_license_code() INTO new_code;
  
  -- Inserir nova licença
  INSERT INTO public.licenses (code, expires_at)
  VALUES (new_code, p_expires_at)
  RETURNING id INTO license_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'license_id', license_id,
    'code', new_code,
    'expires_at', p_expires_at
  );
END;
$function$;