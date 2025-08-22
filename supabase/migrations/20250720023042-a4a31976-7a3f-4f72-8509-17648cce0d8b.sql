-- Simplificar política RLS para debug
DROP POLICY IF EXISTS "rls_user_profiles_select" ON public.user_profiles;
CREATE POLICY "rls_user_profiles_select" 
ON public.user_profiles 
FOR SELECT 
USING (
  (id = auth.uid() OR public.is_current_user_admin())
);