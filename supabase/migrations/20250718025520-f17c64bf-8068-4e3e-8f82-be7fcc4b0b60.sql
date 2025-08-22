-- Corrigir a função is_current_user_admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role TEXT;
  user_active BOOLEAN;
BEGIN
  -- Obter role e status ativo do usuário atual
  SELECT role, is_active INTO user_role, user_active
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  -- Retornar true se for admin E ativo
  RETURN COALESCE(user_role = 'admin' AND user_active = true, false);
END;
$$;