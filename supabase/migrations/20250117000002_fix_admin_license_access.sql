-- Corrigir problema de acesso de administradores
-- O problema é que a função is_current_user_admin() agora requer licença ativa
-- mas os admins podem não ter licenças criadas

-- 1. Criar função temporária para verificar se é admin sem verificar licença
CREATE OR REPLACE FUNCTION public.is_admin_without_license_check()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  user_id UUID;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Buscar role do usuário
  SELECT role INTO user_role
  FROM public.user_profiles 
  WHERE id = user_id;

  -- Retornar true se for admin (sem verificar licença)
  RETURN (user_role = 'admin');
END;
$$;

-- 2. Garantir que todos os administradores tenham licenças ativas
DO $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Para cada usuário admin, criar ou ativar licença
  FOR admin_record IN 
    SELECT id FROM public.user_profiles WHERE role = 'admin'
  LOOP
    -- Verificar se já tem licença ativa
    IF NOT EXISTS (
      SELECT 1 FROM public.licenses 
      WHERE user_id = admin_record.id 
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    ) THEN
      -- Criar nova licença ativa para o admin
      INSERT INTO public.licenses (user_id, code, is_active, expires_at, activated_at)
      VALUES (
        admin_record.id,
        'ADMIN-' || admin_record.id::text,
        true,
        NOW() + INTERVAL '1 year', -- Licença de 1 ano para admins
        NOW()
      )
      ON CONFLICT (code) DO UPDATE SET
        is_active = true,
        expires_at = NOW() + INTERVAL '1 year',
        activated_at = NOW();
      
      RAISE NOTICE 'Licença criada/ativada para admin: %', admin_record.id;
    END IF;
  END LOOP;
END;
$$;

-- 3. Atualizar função is_current_user_admin para ser mais robusta
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

  -- Se não for admin, retornar false imediatamente
  IF user_role != 'admin' THEN
    RETURN FALSE;
  END IF;

  -- Verificar se tem licença válida
  SELECT public.is_user_license_active(user_id) INTO has_valid_license;

  -- Se é admin mas não tem licença válida, criar uma automaticamente
  IF NOT has_valid_license THEN
    INSERT INTO public.licenses (user_id, code, is_active, expires_at, activated_at)
    VALUES (
      user_id,
      'AUTO-ADMIN-' || user_id::text || '-' || extract(epoch from now())::text,
      true,
      NOW() + INTERVAL '1 year',
      NOW()
    )
    ON CONFLICT (code) DO UPDATE SET
      is_active = true,
      expires_at = NOW() + INTERVAL '1 year',
      activated_at = NOW();
    
    has_valid_license := true;
  END IF;

  -- Retornar true se for admin E tiver licença válida
  RETURN (user_role = 'admin' AND has_valid_license);
END;
$$;

-- 4. Simplificar política RLS para user_profiles temporariamente para debug
DROP POLICY IF EXISTS "rls_user_profiles_select" ON public.user_profiles;
CREATE POLICY "rls_user_profiles_select" 
ON public.user_profiles 
FOR SELECT 
USING (
  -- Permitir acesso se:
  -- 1. É o próprio usuário
  id = auth.uid() 
  OR 
  -- 2. É admin (usando função sem verificação de licença para evitar loop)
  public.is_admin_without_license_check()
);

-- 5. Garantir que a função admin_get_all_users funcione
DROP FUNCTION IF EXISTS public.admin_get_all_users();
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(id uuid, name text, email text, role text, license_active boolean, expiration_date timestamp with time zone, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, budget_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin (usando função robusta)
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar todos os usuários.';
  END IF;

  -- Retornar dados com status de licença
  RETURN QUERY
  SELECT
    up.id::uuid,
    up.name::text,
    COALESCE(au.email, (up.name || '@sistema.local'))::text as email,
    up.role::text,
    public.is_user_license_active(up.id)::boolean as license_active,
    COALESCE(l.expires_at, up.created_at + INTERVAL '30 days')::timestamp with time zone as expiration_date,
    up.created_at::timestamp with time zone,
    COALESCE(au.last_sign_in_at, up.created_at)::timestamp with time zone as last_sign_in_at,
    COALESCE((
      SELECT COUNT(*)::integer 
      FROM public.budgets b 
      WHERE b.owner_id = up.id
    ), 0::integer) as budget_count
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON up.id = au.id
  LEFT JOIN public.licenses l ON l.user_id = up.id AND l.is_active = true
  ORDER BY up.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.is_current_user_admin() IS 'Verifica se o usuário atual é admin e tem licença válida. Cria licença automaticamente para admins se necessário.';
COMMENT ON FUNCTION public.admin_get_all_users() IS 'Retorna todos os usuários do sistema. Apenas administradores podem executar esta função.';

-- 6. Atualizar política RLS para usar função principal
DROP POLICY IF EXISTS "rls_user_profiles_select" ON public.user_profiles;
CREATE POLICY "rls_user_profiles_select" 
ON public.user_profiles 
FOR SELECT 
USING (
  -- Permitir acesso se:
  -- 1. É o próprio usuário
  id = auth.uid() 
  OR 
  -- 2. É admin (usando função principal)
  public.is_current_user_admin()
);

-- 7. Remover função temporária
DROP FUNCTION IF EXISTS public.is_admin_without_license_check() CASCADE;