-- Função aprimorada para obter usuários com informações detalhadas de licença
CREATE OR REPLACE FUNCTION public.admin_get_users_with_license_details()
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  role text,
  license_active boolean,
  license_code text,
  license_expires_at timestamp with time zone,
  license_activated_at timestamp with time zone,
  created_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  budget_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar todos os usuários.';
  END IF;

  -- Retornar dados com informações detalhadas de licença
  RETURN QUERY
  SELECT
    up.id::uuid,
    up.name::text,
    COALESCE(au.email, (up.name || '@sistema.local'))::text as email,
    up.role::text,
    COALESCE(l.is_active, false)::boolean as license_active,
    COALESCE(l.code, '')::text as license_code,
    l.expires_at::timestamp with time zone as license_expires_at,
    l.activated_at::timestamp with time zone as license_activated_at,
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

COMMENT ON FUNCTION public.admin_get_users_with_license_details() IS 'Retorna todos os usuários com informações detalhadas de suas licenças, incluindo código de 13 dígitos.';