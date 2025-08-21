
-- Corrigir a função is_current_user_admin() com logs de debug
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  user_role text;
  user_active boolean;
  result boolean;
BEGIN
  -- Obter o ID do usuário atual
  current_user_id := auth.uid();
  
  -- Log para debug
  RAISE NOTICE 'Checking admin status for user ID: %', current_user_id;
  
  -- Se não há usuário logado, retornar false
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'No authenticated user found';
    RETURN FALSE;
  END IF;
  
  -- Buscar role e status ativo do usuário
  SELECT role, is_active 
  INTO user_role, user_active
  FROM public.user_profiles 
  WHERE id = current_user_id;
  
  -- Log para debug
  RAISE NOTICE 'User role: %, User active: %', user_role, user_active;
  
  -- Verificar se encontrou o usuário
  IF user_role IS NULL THEN
    RAISE NOTICE 'User profile not found for ID: %', current_user_id;
    RETURN FALSE;
  END IF;
  
  -- Verificar se é admin e está ativo
  result := (user_role = 'admin' AND user_active = true);
  
  RAISE NOTICE 'Admin check result: %', result;
  
  RETURN result;
END;
$$;

-- Criar uma função auxiliar para debug
CREATE OR REPLACE FUNCTION public.debug_current_user()
RETURNS TABLE(
  user_id uuid,
  user_email text,
  user_role text,
  is_active boolean,
  is_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    au.email as user_email,
    up.role as user_role,
    up.is_active,
    public.is_current_user_admin() as is_admin
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON au.id = up.id
  WHERE au.id = auth.uid();
END;
$$;

-- Atualizar a função admin_get_all_users() com melhor tratamento de erro
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
DECLARE
  current_user_id uuid;
  is_admin boolean;
BEGIN
  -- Debug: obter informações do usuário atual
  current_user_id := auth.uid();
  is_admin := public.is_current_user_admin();
  
  RAISE NOTICE 'admin_get_all_users called by user: %, is_admin: %', current_user_id, is_admin;
  
  -- Verificar se o usuário atual é admin
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar todos os usuários. User ID: %, Is Admin: %', current_user_id, is_admin;
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

-- Recriar as políticas RLS com a função corrigida
DROP POLICY IF EXISTS "Users and admins can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile, admins can update all" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile, admins can insert all" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON public.user_profiles;

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

-- Recriar política para admin_logs
DROP POLICY IF EXISTS "Admins can view and insert admin logs" ON public.admin_logs;
CREATE POLICY "Admins can view and insert admin logs" ON public.admin_logs
  FOR ALL USING (public.is_current_user_admin());
