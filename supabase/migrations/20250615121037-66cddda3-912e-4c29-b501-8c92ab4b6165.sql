
-- Corrigir definitivamente a função admin_get_all_users
DROP FUNCTION IF EXISTS public.admin_get_all_users();

CREATE OR REPLACE FUNCTION public.admin_get_all_users()
 RETURNS TABLE(
   id uuid, 
   name text, 
   email text, 
   role text, 
   is_active boolean, 
   expiration_date timestamp with time zone, 
   created_at timestamp with time zone, 
   last_sign_in_at timestamp with time zone, 
   budget_count integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar todos os usuários.';
  END IF;

  -- Retornar dados com tipos explícitos
  RETURN QUERY
  SELECT
    up.id::uuid,
    up.name::text,
    COALESCE(au.email::text, (up.name || '@local.domain')::text),
    up.role::text,
    up.is_active::boolean,
    up.expiration_date::timestamp with time zone,
    up.created_at::timestamp with time zone,
    au.last_sign_in_at::timestamp with time zone,
    COALESCE((
      SELECT COUNT(*)::integer 
      FROM public.budgets b 
      WHERE b.owner_id = up.id
    ), 0::integer) as budget_count
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON up.id = au.id
  ORDER BY up.created_at DESC;
END;
$function$;
