-- Corrigir a função admin_get_licenses_with_users para retornar a estrutura correta
DROP FUNCTION IF EXISTS public.admin_get_licenses_with_users();

CREATE OR REPLACE FUNCTION public.admin_get_licenses_with_users()
 RETURNS TABLE(
   id uuid, 
   code text, 
   user_id uuid, 
   user_email text, 
   user_name text, 
   expires_at timestamp with time zone, 
   created_at timestamp with time zone, 
   is_active boolean
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Verificar se é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar todas as licenças';
  END IF;
  
  RETURN QUERY
  SELECT 
    l.id,
    l.code,
    l.user_id,
    COALESCE(au.email, '') as user_email,
    COALESCE(up.name, '') as user_name,
    l.expires_at,
    l.created_at,
    l.is_active
  FROM public.licenses l
  LEFT JOIN auth.users au ON l.user_id = au.id
  LEFT JOIN public.user_profiles up ON l.user_id = up.id
  ORDER BY l.created_at DESC;
END;
$function$;