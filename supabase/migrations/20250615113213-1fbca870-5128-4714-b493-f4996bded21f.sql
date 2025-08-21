
DROP FUNCTION IF EXISTS public.admin_get_all_users();

CREATE FUNCTION public.admin_get_all_users()
 RETURNS TABLE(id uuid, name text, email text, role text, is_active boolean, expiration_date timestamp with time zone, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, budget_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar todos os usuários.';
  END IF;

  RETURN QUERY
  SELECT
    up.id,
    up.name,
    COALESCE(au.email, (up.name || '@local.domain')::text) as email,
    up.role,
    up.is_active,
    up.expiration_date,
    up.created_at,
    au.last_sign_in_at,
    (SELECT COUNT(*) FROM public.budgets WHERE owner_id = up.id) as budget_count
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON up.id = au.id
  ORDER BY up.created_at DESC;
END;
$function$;
