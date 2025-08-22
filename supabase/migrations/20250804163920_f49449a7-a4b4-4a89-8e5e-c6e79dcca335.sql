-- Remove user expiration system, keep only license expiration

-- 1. Remove expiration_date and is_active columns from user_profiles
ALTER TABLE public.user_profiles 
DROP COLUMN IF EXISTS expiration_date,
DROP COLUMN IF EXISTS is_active;

-- 2. Update is_license_valid function to only check license, not user profile
CREATE OR REPLACE FUNCTION public.is_license_valid(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  license_valid BOOLEAN := false;
BEGIN
  -- Verificar se é o próprio usuário ou admin
  IF p_user_id != auth.uid() AND NOT public.is_current_user_admin() THEN
    RETURN false;
  END IF;
  
  -- Verificar apenas se existe licença ativa e não expirada
  SELECT EXISTS (
    SELECT 1 
    FROM public.licenses 
    WHERE user_id = p_user_id 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO license_valid;
  
  RETURN license_valid;
END;
$function$;

-- 3. Update activate_license_enhanced function to not update user profile expiration
CREATE OR REPLACE FUNCTION public.activate_license_enhanced(license_code text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  license_record RECORD;
  existing_license RECORD;
BEGIN
  -- Buscar a licença pelo código
  SELECT * INTO license_record
  FROM public.licenses
  WHERE code = license_code;
  
  -- Verificar se a licença existe
  IF license_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Código de licença inválido',
      'error_type', 'invalid_code'
    );
  END IF;
  
  -- Verificar se a licença já está ativa
  IF license_record.is_active = TRUE THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Esta licença já está sendo utilizada por outro usuário',
      'error_type', 'already_used'
    );
  END IF;
  
  -- Verificar se a licença está expirada
  IF license_record.expires_at IS NOT NULL AND license_record.expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Esta licença está expirada',
      'error_type', 'expired'
    );
  END IF;
  
  -- Verificar se o usuário já tem uma licença ativa
  SELECT * INTO existing_license
  FROM public.licenses
  WHERE user_id = p_user_id AND is_active = TRUE;
  
  -- Desativar licença anterior se existir
  IF existing_license IS NOT NULL THEN
    UPDATE public.licenses
    SET is_active = FALSE, last_validation = NOW()
    WHERE id = existing_license.id;
  END IF;
  
  -- Ativar a nova licença (sem alterar user_profiles)
  UPDATE public.licenses
  SET 
    user_id = p_user_id,
    is_active = TRUE,
    activated_at = NOW(),
    expires_at = NOW() + INTERVAL '30 days',
    last_validation = NOW()
  WHERE code = license_code;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Licença ativada com sucesso! Válida por 30 dias.',
    'expires_at', NOW() + INTERVAL '30 days',
    'activated_at', NOW()
  );
END;
$function$;