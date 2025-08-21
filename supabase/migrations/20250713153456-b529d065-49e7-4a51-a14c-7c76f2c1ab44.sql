-- Corrigir funções que acessam auth.users diretamente
-- O problema é que auth.users não pode ser acessado via RLS policies

-- 1. Corrigir função admin_get_all_users para não usar auth.users em contexto RLS
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
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar todos os usuários.';
  END IF;

  -- Retornar dados apenas do user_profiles (sem auth.users)
  RETURN QUERY
  SELECT
    up.id::uuid,
    up.name::text,
    (up.name || '@sistema.local')::text as email, -- Email simulado
    up.role::text,
    up.is_active::boolean,
    up.expiration_date::timestamp with time zone,
    up.created_at::timestamp with time zone,
    up.created_at::timestamp with time zone as last_sign_in_at, -- Usar created_at como fallback
    COALESCE((
      SELECT COUNT(*)::integer 
      FROM public.budgets b 
      WHERE b.owner_id = up.id
    ), 0::integer) as budget_count
  FROM public.user_profiles up
  ORDER BY up.created_at DESC;
END;
$$;

-- 2. Corrigir função debug_current_user
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
  
  -- Se não há usuário logado, retornar dados nulos mas com estrutura correta
  IF current_user_id IS NULL THEN
    RETURN QUERY
    SELECT 
      NULL::uuid as user_id,
      'No authenticated user'::text as user_email,
      'No role'::text as user_role,
      false as is_active,
      false as is_admin;
    RETURN;
  END IF;
  
  -- Buscar dados apenas do user_profiles
  RETURN QUERY
  SELECT 
    current_user_id as user_id,
    (up.name || '@sistema.local')::text as user_email, -- Email simulado
    COALESCE(up.role, 'No role')::text as user_role,
    COALESCE(up.is_active, false) as is_active,
    COALESCE((up.role = 'admin' AND up.is_active = true), false) as is_admin
  FROM public.user_profiles up
  WHERE up.id = current_user_id;
  
  -- Se não encontrou dados, retornar informação básica
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      current_user_id as user_id,
      'User not found'::text as user_email,
      'No role'::text as user_role,
      false as is_active,
      false as is_admin;
  END IF;
END;
$$;