
-- Corrigir a função admin_get_all_users para retornar email corretamente
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
    COALESCE(au.email, up.name || '@email.local') as email,
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
