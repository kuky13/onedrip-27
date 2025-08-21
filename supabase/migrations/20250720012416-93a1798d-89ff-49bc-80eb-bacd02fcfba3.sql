-- Melhorias no sistema de licenças
-- 1. Adicionar campos de rastreamento na tabela licenses
ALTER TABLE public.licenses 
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_validation TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Criar função para garantir licenças únicas por usuário
CREATE OR REPLACE FUNCTION public.ensure_unique_license()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se já existe uma licença ativa para este usuário
  IF NEW.user_id IS NOT NULL AND NEW.is_active = TRUE THEN
    -- Desativar outras licenças do mesmo usuário
    UPDATE public.licenses 
    SET is_active = FALSE, last_validation = NOW()
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND is_active = TRUE;
  END IF;
  
  -- Definir activated_at se a licença está sendo ativada
  IF NEW.is_active = TRUE AND OLD.is_active = FALSE THEN
    NEW.activated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger para garantir unicidade
DROP TRIGGER IF EXISTS ensure_unique_license_trigger ON public.licenses;
CREATE TRIGGER ensure_unique_license_trigger
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_unique_license();

-- 4. Função para validar status de licença em tempo real
CREATE OR REPLACE FUNCTION public.validate_user_license(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  license_record RECORD;
  result JSONB;
BEGIN
  -- Buscar licença ativa do usuário
  SELECT * INTO license_record
  FROM public.licenses
  WHERE user_id = p_user_id 
  AND is_active = TRUE
  ORDER BY activated_at DESC
  LIMIT 1;
  
  IF license_record IS NULL THEN
    RETURN jsonb_build_object(
      'has_license', false,
      'is_valid', false,
      'message', 'Nenhuma licença ativa encontrada'
    );
  END IF;
  
  -- Verificar se a licença está expirada
  IF license_record.expires_at IS NOT NULL AND license_record.expires_at < NOW() THEN
    -- Desativar licença expirada
    UPDATE public.licenses 
    SET is_active = FALSE, last_validation = NOW()
    WHERE id = license_record.id;
    
    RETURN jsonb_build_object(
      'has_license', true,
      'is_valid', false,
      'message', 'Licença expirada',
      'expired_at', license_record.expires_at
    );
  END IF;
  
  -- Atualizar última validação
  UPDATE public.licenses 
  SET last_validation = NOW()
  WHERE id = license_record.id;
  
  -- Licença válida
  RETURN jsonb_build_object(
    'has_license', true,
    'is_valid', true,
    'license_code', license_record.code,
    'expires_at', license_record.expires_at,
    'activated_at', license_record.activated_at,
    'days_remaining', CASE 
      WHEN license_record.expires_at IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM license_record.expires_at - NOW())::INTEGER
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Função para ativar licença com validação completa
CREATE OR REPLACE FUNCTION public.activate_license_enhanced(
  license_code TEXT, 
  p_user_id UUID
)
RETURNS JSONB AS $$
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
  
  -- Ativar a nova licença
  UPDATE public.licenses
  SET 
    user_id = p_user_id,
    is_active = TRUE,
    activated_at = NOW(),
    expires_at = NOW() + INTERVAL '30 days',
    last_validation = NOW()
  WHERE code = license_code;
  
  -- Reativar usuário se necessário
  UPDATE public.user_profiles
  SET 
    is_active = TRUE,
    expiration_date = NOW() + INTERVAL '30 days'
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Licença ativada com sucesso! Válida por 30 dias.',
    'expires_at', NOW() + INTERVAL '30 days',
    'activated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para admin criar licenças em lote
CREATE OR REPLACE FUNCTION public.admin_create_bulk_licenses(
  p_quantity INTEGER,
  p_expires_in_days INTEGER DEFAULT 365
)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função para relatórios de licenças
CREATE OR REPLACE FUNCTION public.admin_get_license_stats()
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  -- Verificar se é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar estatísticas';
  END IF;

  WITH license_stats AS (
    SELECT 
      COUNT(*) as total_licenses,
      COUNT(*) FILTER (WHERE is_active = true) as active_licenses,
      COUNT(*) FILTER (WHERE is_active = false AND user_id IS NOT NULL) as used_licenses,
      COUNT(*) FILTER (WHERE is_active = false AND user_id IS NULL) as unused_licenses,
      COUNT(*) FILTER (WHERE expires_at < NOW() AND is_active = true) as expired_active,
      COUNT(*) FILTER (WHERE expires_at < NOW() + INTERVAL '7 days' AND is_active = true) as expiring_soon,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as created_today,
      COUNT(*) FILTER (WHERE activated_at >= CURRENT_DATE) as activated_today
    FROM public.licenses
  )
  SELECT jsonb_build_object(
    'total_licenses', total_licenses,
    'active_licenses', active_licenses,
    'used_licenses', used_licenses,
    'unused_licenses', unused_licenses,
    'expired_active', expired_active,
    'expiring_soon', expiring_soon,
    'created_today', created_today,
    'activated_today', activated_today,
    'timestamp', NOW()
  ) INTO stats
  FROM license_stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;