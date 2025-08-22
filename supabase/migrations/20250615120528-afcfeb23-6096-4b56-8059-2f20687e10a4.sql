
-- Corrigir a função admin_get_all_users para resolver incompatibilidade de tipos
DROP FUNCTION IF EXISTS public.admin_get_all_users();

CREATE OR REPLACE FUNCTION public.admin_get_all_users()
 RETURNS TABLE(id uuid, name text, email text, role text, is_active boolean, expiration_date timestamp with time zone, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, budget_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar todos os usuários.';
  END IF;

  RETURN QUERY
  WITH user_budget_counts AS (
    SELECT 
      owner_id,
      COUNT(*)::integer as budget_count
    FROM public.budgets 
    GROUP BY owner_id
  )
  SELECT
    up.id,
    up.name,
    COALESCE(au.email, (up.name || '@local.domain')::text) as email,
    up.role,
    up.is_active,
    up.expiration_date,
    up.created_at,
    au.last_sign_in_at,
    COALESCE(ubc.budget_count, 0)::integer as budget_count
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON up.id = au.id
  LEFT JOIN user_budget_counts ubc ON up.id = ubc.owner_id
  ORDER BY up.created_at DESC;
END;
$function$;
