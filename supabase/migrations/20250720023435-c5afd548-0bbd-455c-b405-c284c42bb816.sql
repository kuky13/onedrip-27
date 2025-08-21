-- Restaurar políticas RLS mais robustas e limpar todos os dados

-- 1. Restaurar política RLS mais robusta para user_profiles
DROP POLICY IF EXISTS "rls_user_profiles_select" ON public.user_profiles;
CREATE POLICY "rls_user_profiles_select" 
ON public.user_profiles 
FOR SELECT 
USING (
  (id = auth.uid() OR public.is_current_user_admin()) 
  AND (public.is_current_user_admin() OR (id = auth.uid() AND public.is_user_license_active(auth.uid())))
);

-- 2. Limpar todos os dados das tabelas (ordem importante devido às dependências)

-- Limpar dados das tabelas dependentes primeiro
DELETE FROM public.budget_deletion_audit;
DELETE FROM public.budget_parts;
DELETE FROM public.budgets;
DELETE FROM public.clients;
DELETE FROM public.admin_logs;
DELETE FROM public.ranking_invaders;
DELETE FROM public.shop_profiles;

-- Limpar licenças
DELETE FROM public.licenses;

-- Limpar perfis de usuário (por último)
DELETE FROM public.user_profiles;

-- Resetar admin_images se existir dados
DELETE FROM public.admin_images;