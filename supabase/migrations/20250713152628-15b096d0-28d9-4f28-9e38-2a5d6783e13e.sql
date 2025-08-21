-- Corrigir política RLS que está bloqueando o login
-- O problema é que a política atual exige email confirmado para acessar user_profiles
-- mas precisamos permitir acesso durante o processo de login para verificar o perfil

-- Remover a política atual que está muito restritiva
DROP POLICY IF EXISTS "rls_user_profiles_select" ON public.user_profiles;

-- Criar nova política mais permissiva para SELECT
-- Permite acesso ao próprio perfil OU se for admin
-- Não exige email confirmado para esta operação básica
CREATE POLICY "rls_user_profiles_select" 
ON public.user_profiles 
FOR SELECT 
USING (
  (id = auth.uid() OR is_current_user_admin())
);

-- Para budgets, manter a verificação de email confirmado
-- mas só aplicar para usuários normais (não admins)
DROP POLICY IF EXISTS "rls_budgets_select" ON public.budgets;
CREATE POLICY "rls_budgets_select" 
ON public.budgets 
FOR SELECT 
USING (
  (
    (owner_id = auth.uid() AND deleted_at IS NULL) 
    OR is_current_user_admin()
  )
  AND (
    -- Para admins, sem restrição de email
    is_current_user_admin() 
    OR 
    -- Para usuários normais, verificar se email foi confirmado
    (owner_id = auth.uid() AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email_confirmed_at IS NOT NULL
    ))
  )
);