-- Corrigir erro: remover função existente antes de recriar com nova assinatura

-- 1. Remover função existente
DROP FUNCTION IF EXISTS public.admin_get_all_users();

-- 2. Criar função para verificar se usuário tem licença ativa
CREATE OR REPLACE FUNCTION public.is_user_license_active(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  license_valid boolean;
BEGIN
  -- Verificar se usuário tem licença ativa e não expirada
  SELECT EXISTS(
    SELECT 1 FROM public.licenses 
    WHERE user_id = p_user_id 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO license_valid;
  
  RETURN license_valid;
END;
$$;

-- 3. Atualizar função is_current_user_admin para usar licenças
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  user_id UUID;
  has_valid_license BOOLEAN;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Buscar role do usuário
  SELECT role INTO user_role
  FROM public.user_profiles 
  WHERE id = user_id;

  -- Verificar se tem licença válida
  SELECT public.is_user_license_active(user_id) INTO has_valid_license;

  -- Retornar true se for admin E tiver licença válida
  RETURN (user_role = 'admin' AND has_valid_license);
END;
$$;

-- 4. Atualizar função is_license_valid para ser o controle principal
CREATE OR REPLACE FUNCTION public.is_license_valid(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.is_user_license_active(p_user_id);
END;
$$;

-- 5. Criar função admin para ativar licença de usuário
CREATE OR REPLACE FUNCTION public.admin_activate_user_license(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_license RECORD;
BEGIN
  -- Verificar se é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem ativar licenças';
  END IF;

  -- Buscar licença existente do usuário
  SELECT * INTO existing_license
  FROM public.licenses
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF existing_license IS NULL THEN
    -- Criar nova licença se não existir
    INSERT INTO public.licenses (user_id, is_active, expires_at)
    VALUES (p_user_id, true, NOW() + INTERVAL '30 days');
  ELSE
    -- Ativar licença existente
    UPDATE public.licenses
    SET 
      is_active = true,
      expires_at = CASE 
        WHEN expires_at < NOW() THEN NOW() + INTERVAL '30 days'
        ELSE expires_at
      END
    WHERE id = existing_license.id;
  END IF;

  -- Log da ação
  PERFORM public.log_admin_access(
    'activate_user_license',
    'user',
    p_user_id::text,
    jsonb_build_object('user_id', p_user_id)
  );

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id);
END;
$$;

-- 6. Criar função admin para desativar licença de usuário
CREATE OR REPLACE FUNCTION public.admin_deactivate_user_license(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem desativar licenças';
  END IF;

  -- Desativar todas as licenças do usuário
  UPDATE public.licenses
  SET is_active = false
  WHERE user_id = p_user_id;

  -- Log da ação
  PERFORM public.log_admin_access(
    'deactivate_user_license',
    'user',
    p_user_id::text,
    jsonb_build_object('user_id', p_user_id)
  );

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id);
END;
$$;

-- 7. Recriar função admin_get_all_users com nova assinatura
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(id uuid, name text, email text, role text, license_active boolean, expiration_date timestamp with time zone, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, budget_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar todos os usuários.';
  END IF;

  -- Retornar dados com status de licença ao invés de is_active
  RETURN QUERY
  SELECT
    up.id::uuid,
    up.name::text,
    COALESCE(au.email, (up.name || '@sistema.local'))::text as email,
    up.role::text,
    public.is_user_license_active(up.id)::boolean as license_active,
    up.expiration_date::timestamp with time zone,
    up.created_at::timestamp with time zone,
    COALESCE(au.last_sign_in_at, up.created_at)::timestamp with time zone as last_sign_in_at,
    COALESCE((
      SELECT COUNT(*)::integer 
      FROM public.budgets b 
      WHERE b.owner_id = up.id
    ), 0::integer) as budget_count
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON up.id = au.id
  ORDER BY up.created_at DESC;
END;
$$;

-- 8. Atualizar políticas RLS para usar licenças ao invés de is_active
DROP POLICY IF EXISTS "rls_user_profiles_select" ON public.user_profiles;
CREATE POLICY "rls_user_profiles_select" 
ON public.user_profiles 
FOR SELECT 
USING (
  (id = auth.uid() OR public.is_current_user_admin())
  AND (
    -- Para admins, sem restrição
    public.is_current_user_admin() 
    OR 
    -- Para usuários normais, verificar email confirmado e licença ativa
    (id = auth.uid() AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email_confirmed_at IS NOT NULL
    ) AND public.is_user_license_active(auth.uid()))
  )
);

-- 9. Atualizar política para budgets
DROP POLICY IF EXISTS "budgets_select_policy" ON public.budgets;
CREATE POLICY "budgets_select_policy" 
ON public.budgets 
FOR SELECT 
USING (
  (
    (owner_id = auth.uid() AND deleted_at IS NULL) 
    OR public.is_current_user_admin()
  )
  AND (
    -- Para admins, sem restrição
    public.is_current_user_admin() 
    OR 
    -- Para usuários normais, verificar licença ativa
    (owner_id = auth.uid() AND public.is_user_license_active(auth.uid()))
  )
);

-- 10. Remover triggers antigos relacionados a is_active
DROP TRIGGER IF EXISTS check_expiration_trigger ON public.user_profiles;
DROP FUNCTION IF EXISTS public.check_user_expiration();
DROP FUNCTION IF EXISTS public.update_expired_users();

-- 11. Remover coluna is_active da tabela user_profiles
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS is_active;