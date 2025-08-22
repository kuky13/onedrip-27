
-- First, drop all policies that depend on is_current_user_admin()
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view admin logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Users can update own profile, admins can update all" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile, admins can insert all" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view and insert admin logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Users and admins can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can view audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Admin can view activity metrics" ON public.user_activity_metrics;

-- Now we can safely drop and recreate the functions
DROP FUNCTION IF EXISTS public.is_current_user_admin();
DROP FUNCTION IF EXISTS public.debug_current_user();
DROP FUNCTION IF EXISTS public.admin_get_all_users();

-- 1. Corrigir a função debug_current_user() para resolver problemas de tipos
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
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  RAISE NOTICE 'debug_current_user: Checking user ID: %', current_user_id;
  
  -- Se não há usuário logado, retornar dados nulos mas com estrutura correta
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'debug_current_user: No authenticated user found';
    RETURN QUERY
    SELECT 
      NULL::uuid as user_id,
      'No authenticated user'::text as user_email,
      'No role'::text as user_role,
      false as is_active,
      false as is_admin;
    RETURN;
  END IF;
  
  -- Buscar dados do usuário logado
  RETURN QUERY
  SELECT 
    current_user_id as user_id,
    COALESCE(au.email, 'Email not found')::text as user_email,
    COALESCE(up.role, 'No role')::text as user_role,
    COALESCE(up.is_active, false) as is_active,
    COALESCE((up.role = 'admin' AND up.is_active = true), false) as is_admin
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON au.id = up.id
  WHERE au.id = current_user_id;
  
  -- Se não encontrou dados, retornar informação básica
  IF NOT FOUND THEN
    RAISE NOTICE 'debug_current_user: User not found in auth.users, checking user_profiles only';
    RETURN QUERY
    SELECT 
      current_user_id as user_id,
      'User not in auth.users'::text as user_email,
      COALESCE(up.role, 'No role')::text as user_role,
      COALESCE(up.is_active, false) as is_active,
      COALESCE((up.role = 'admin' AND up.is_active = true), false) as is_admin
    FROM public.user_profiles up
    WHERE up.id = current_user_id;
  END IF;
END;
$$;

-- 2. Criar função auxiliar para verificação de admin sem recursão (deve vir antes da is_current_user_admin)
CREATE OR REPLACE FUNCTION public.check_if_user_is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = user_id AND role = 'admin' AND is_active = true
  );
$$;

-- 3. Corrigir completamente a função is_current_user_admin()
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  user_role text;
  user_active boolean;
  result boolean := false;
BEGIN
  -- Obter o ID do usuário atual
  current_user_id := auth.uid();
  
  RAISE NOTICE 'is_current_user_admin: Checking admin status for user ID: %', current_user_id;
  
  -- Se não há usuário logado, retornar false
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'is_current_user_admin: No authenticated user found';
    RETURN false;
  END IF;
  
  -- Usar a função auxiliar para evitar problemas de recursão
  RETURN public.check_if_user_is_admin(current_user_id);
END;
$$;

-- 4. Corrigir a função admin_get_all_users com melhor tratamento de erros
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
  
  RAISE NOTICE 'admin_get_all_users: Called by user: %', current_user_id;
  
  -- Verificar se há usuário logado
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado';
  END IF;
  
  -- Verificar se o usuário atual é admin usando lógica direta
  SELECT public.check_if_user_is_admin(current_user_id) INTO is_admin;
  
  RAISE NOTICE 'admin_get_all_users: User % is admin: %', current_user_id, is_admin;
  
  -- Verificar se o usuário atual é admin
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar todos os usuários. User ID: %, Is Admin: %', current_user_id, is_admin;
  END IF;

  -- Retornar todos os usuários
  RETURN QUERY
  SELECT 
    up.id,
    up.name,
    COALESCE(au.email, up.name || '@local.domain') as email,
    up.role,
    up.is_active,
    up.expiration_date,
    up.created_at,
    au.last_sign_in_at
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON up.id = au.id
  ORDER BY up.created_at DESC;
  
  RAISE NOTICE 'admin_get_all_users: Successfully returned user list';
END;
$$;

-- 5. Recriar políticas RLS usando a função auxiliar para evitar recursão
CREATE POLICY "Users can view own profile and admins view all" ON public.user_profiles
  FOR SELECT USING (
    id = auth.uid() OR public.check_if_user_is_admin(auth.uid())
  );

CREATE POLICY "Users can update own profile and admins update all" ON public.user_profiles
  FOR UPDATE USING (
    id = auth.uid() OR public.check_if_user_is_admin(auth.uid())
  );

CREATE POLICY "Users can insert own profile and admins insert all" ON public.user_profiles
  FOR INSERT WITH CHECK (
    id = auth.uid() OR public.check_if_user_is_admin(auth.uid())
  );

CREATE POLICY "Only admins can delete user profiles" ON public.user_profiles
  FOR DELETE USING (
    public.check_if_user_is_admin(auth.uid()) AND id != auth.uid()
  );

-- 6. Recriar políticas para admin_logs
CREATE POLICY "Only admins can access admin logs" ON public.admin_logs
  FOR ALL USING (public.check_if_user_is_admin(auth.uid()));

-- 7. Recriar políticas para admin_audit_log se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_log' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Only admins can access audit logs" ON public.admin_audit_log FOR ALL USING (public.check_if_user_is_admin(auth.uid()))';
  END IF;
END $$;

-- 8. Recriar políticas para user_activity_metrics se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_metrics' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Only admins can access activity metrics" ON public.user_activity_metrics FOR ALL USING (public.check_if_user_is_admin(auth.uid()))';
  END IF;
END $$;

-- 9. Função de teste para validar configurações
CREATE OR REPLACE FUNCTION public.test_admin_permissions()
RETURNS TABLE(
  test_name text,
  result boolean,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  user_count integer;
BEGIN
  current_user_id := auth.uid();
  
  -- Teste 1: Verificar se há usuário logado
  RETURN QUERY
  SELECT 
    'User Authentication'::text,
    (current_user_id IS NOT NULL),
    ('Current user ID: ' || COALESCE(current_user_id::text, 'NULL'))::text;
  
  -- Teste 2: Verificar se é admin
  RETURN QUERY
  SELECT 
    'Admin Check'::text,
    public.check_if_user_is_admin(current_user_id),
    ('Admin status: ' || public.check_if_user_is_admin(current_user_id)::text)::text;
  
  -- Teste 3: Contar usuários accessíveis
  SELECT COUNT(*) INTO user_count
  FROM public.user_profiles
  WHERE id = current_user_id OR public.check_if_user_is_admin(current_user_id);
  
  RETURN QUERY
  SELECT 
    'Accessible Users Count'::text,
    (user_count > 0),
    ('Can access ' || user_count::text || ' user profiles')::text;
END;
$$;

-- 10. Garantir que existe pelo menos um usuário admin ativo
DO $$
DECLARE
  admin_count integer;
  kuky_user_id uuid;
BEGIN
  -- Verificar quantos admins ativos existem
  SELECT COUNT(*) INTO admin_count
  FROM public.user_profiles
  WHERE role = 'admin' AND is_active = true;
  
  RAISE NOTICE 'Current active admin count: %', admin_count;
  
  -- Se não há admins, tentar encontrar e ativar o usuário kuky
  IF admin_count = 0 THEN
    SELECT au.id INTO kuky_user_id
    FROM auth.users au
    WHERE au.email = 'kuky.png@gmail.com'
    LIMIT 1;
    
    IF kuky_user_id IS NOT NULL THEN
      -- Inserir ou atualizar perfil do kuky como admin
      INSERT INTO public.user_profiles (id, name, role, is_active, expiration_date)
      VALUES (kuky_user_id, 'Admin Kuky', 'admin', true, NOW() + INTERVAL '1 year')
      ON CONFLICT (id) DO UPDATE SET 
        role = 'admin',
        is_active = true,
        expiration_date = NOW() + INTERVAL '1 year';
      
      RAISE NOTICE 'Updated kuky user to admin status';
    ELSE
      RAISE NOTICE 'Kuky user not found in auth.users';
    END IF;
  END IF;
END $$;
