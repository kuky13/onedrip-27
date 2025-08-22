
-- Remover todas as políticas existentes da tabela user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users and admins can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile, admins can update all" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile, admins can insert all" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON public.user_profiles;

-- Remover todas as políticas existentes da tabela admin_logs
DROP POLICY IF EXISTS "Admins can view admin logs" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view and insert admin logs" ON public.admin_logs;

-- Recriar as políticas corretas para user_profiles
CREATE POLICY "Users and admins can view profiles" ON public.user_profiles
  FOR SELECT USING (
    id = auth.uid() OR public.is_current_user_admin()
  );

CREATE POLICY "Users can update own profile, admins can update all" ON public.user_profiles
  FOR UPDATE USING (
    id = auth.uid() OR public.is_current_user_admin()
  );

CREATE POLICY "Users can insert own profile, admins can insert all" ON public.user_profiles
  FOR INSERT WITH CHECK (
    id = auth.uid() OR public.is_current_user_admin()
  );

CREATE POLICY "Admins can delete user profiles" ON public.user_profiles
  FOR DELETE USING (
    public.is_current_user_admin() AND id != auth.uid()
  );

-- Recriar as políticas para admin_logs
CREATE POLICY "Admins can view and insert admin logs" ON public.admin_logs
  FOR ALL USING (public.is_current_user_admin());

-- Atualizar a função admin_get_all_users
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  is_active boolean,
  expiration_date timestamp with time zone,
  created_at timestamp with time zone,
  last_sign_in_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar todos os usuários';
  END IF;

  RETURN QUERY
  SELECT 
    up.id,
    up.name,
    COALESCE(au.email, 'Email não disponível') as email,
    up.role,
    up.is_active,
    up.expiration_date,
    up.created_at,
    au.last_sign_in_at
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON up.id = au.id
  ORDER BY up.created_at DESC;
END;
$$;

-- Função para buscar logs administrativos
CREATE OR REPLACE FUNCTION public.admin_get_logs()
RETURNS TABLE (
  id uuid,
  admin_user_id uuid,
  admin_name text,
  target_user_id uuid,
  target_name text,
  action text,
  details jsonb,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar logs';
  END IF;

  RETURN QUERY
  SELECT 
    al.id,
    al.admin_user_id,
    COALESCE(admin_profile.name, 'Admin Desconhecido') as admin_name,
    al.target_user_id,
    COALESCE(target_profile.name, 'Usuário Desconhecido') as target_name,
    al.action,
    al.details,
    al.created_at
  FROM public.admin_logs al
  LEFT JOIN public.user_profiles admin_profile ON al.admin_user_id = admin_profile.id
  LEFT JOIN public.user_profiles target_profile ON al.target_user_id = target_profile.id
  ORDER BY al.created_at DESC
  LIMIT 100;
END;
$$;
