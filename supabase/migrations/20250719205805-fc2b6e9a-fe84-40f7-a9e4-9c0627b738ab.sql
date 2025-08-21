
-- Criar a tabela de licenças
CREATE TABLE public.licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT FALSE
);

-- Habilitar RLS na tabela licenses
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Política para admins terem acesso completo
CREATE POLICY "Admins can manage all licenses" ON public.licenses
  FOR ALL USING (public.is_current_user_admin());

-- Política para usuários verem apenas suas licenças ativas
CREATE POLICY "Users can view their active licenses" ON public.licenses
  FOR SELECT USING (
    auth.uid() = user_id AND is_active = TRUE
  );

-- Função para gerar códigos de licença únicos no formato 344333XXXXXXX
CREATE OR REPLACE FUNCTION public.generate_license_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_code TEXT := '344333';
  random_digits TEXT;
  full_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar 7 dígitos aleatórios
    random_digits := LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
    
    -- Formar o código completo
    full_code := base_code || random_digits;
    
    -- Verificar se o código já existe
    SELECT EXISTS(SELECT 1 FROM public.licenses WHERE code = full_code) INTO code_exists;
    
    -- Se não existe, retornar o código
    IF NOT code_exists THEN
      RETURN full_code;
    END IF;
  END LOOP;
END;
$$;

-- Função para ativar uma licença
CREATE OR REPLACE FUNCTION public.activate_license(license_code TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  license_record RECORD;
  result JSONB;
BEGIN
  -- Buscar a licença pelo código
  SELECT * INTO license_record
  FROM public.licenses
  WHERE code = license_code;
  
  -- Verificar se a licença existe
  IF license_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código de licença inválido');
  END IF;
  
  -- Verificar se a licença já está ativa
  IF license_record.is_active = TRUE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta licença já está sendo utilizada');
  END IF;
  
  -- Verificar se a licença está expirada
  IF license_record.expires_at IS NOT NULL AND license_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta licença está expirada');
  END IF;
  
  -- Ativar a licença
  UPDATE public.licenses
  SET 
    user_id = p_user_id,
    is_active = TRUE,
    expires_at = COALESCE(expires_at, NOW() + INTERVAL '30 days')
  WHERE code = license_code;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Licença ativada com sucesso',
    'expires_at', COALESCE(license_record.expires_at, NOW() + INTERVAL '30 days')
  );
END;
$$;

-- Função para administradores criarem licenças
CREATE OR REPLACE FUNCTION public.admin_create_license(p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Função para renovar licenças
CREATE OR REPLACE FUNCTION public.admin_renew_license(license_id UUID, additional_days INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  license_record RECORD;
  new_expiration TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Verificar se é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem renovar licenças';
  END IF;
  
  -- Buscar a licença
  SELECT * INTO license_record
  FROM public.licenses
  WHERE id = license_id;
  
  IF license_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Licença não encontrada');
  END IF;
  
  -- Calcular nova data de expiração
  IF license_record.expires_at IS NULL OR license_record.expires_at < NOW() THEN
    new_expiration := NOW() + (additional_days || ' days')::INTERVAL;
  ELSE
    new_expiration := license_record.expires_at + (additional_days || ' days')::INTERVAL;
  END IF;
  
  -- Atualizar licença
  UPDATE public.licenses
  SET expires_at = new_expiration
  WHERE id = license_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'new_expiration', new_expiration
  );
END;
$$;

-- Função para obter licenças com informações do usuário
CREATE OR REPLACE FUNCTION public.admin_get_licenses_with_users()
RETURNS TABLE (
  id UUID,
  code TEXT,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar todas as licenças';
  END IF;
  
  RETURN QUERY
  SELECT 
    l.id,
    l.code,
    l.user_id,
    au.email as user_email,
    up.name as user_name,
    l.expires_at,
    l.created_at,
    l.is_active
  FROM public.licenses l
  LEFT JOIN auth.users au ON l.user_id = au.id
  LEFT JOIN public.user_profiles up ON l.user_id = up.id
  ORDER BY l.created_at DESC;
END;
$$;
