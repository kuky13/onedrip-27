
-- Corrigir o problema de tipo na função admin_get_all_users
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

  -- Retornar todos os usuários com cast explícito para text
  RETURN QUERY
  SELECT 
    up.id,
    up.name,
    COALESCE(au.email::text, (up.name || '@local.domain')::text) as email,
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
