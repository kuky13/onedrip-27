-- Limpar dados preservando clientes padrão

-- 1. Limpar dados das tabelas dependentes primeiro (ordem importante)
DELETE FROM public.budget_deletion_audit;
DELETE FROM public.budget_parts;
DELETE FROM public.budgets;
DELETE FROM public.admin_logs;
DELETE FROM public.ranking_invaders;
DELETE FROM public.shop_profiles;

-- 2. Limpar clientes não-padrão (preservar is_default = true)
DELETE FROM public.clients WHERE is_default IS NOT TRUE;

-- 3. Limpar licenças não vinculadas a usuários admin
DELETE FROM public.licenses 
WHERE user_id NOT IN (
  SELECT id FROM public.user_profiles WHERE role = 'admin'
);

-- 4. Limpar perfis de usuário não-admin
DELETE FROM public.user_profiles WHERE role != 'admin';

-- 5. Resetar admin_images se existir dados
DELETE FROM public.admin_images;