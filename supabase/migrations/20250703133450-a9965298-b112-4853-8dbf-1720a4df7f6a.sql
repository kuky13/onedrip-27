-- Limpeza completa do banco de dados mantendo apenas kuky.png@gmail.com

-- 1. Deletar todas as partes de orçamentos
DELETE FROM public.budget_parts;

-- 2. Deletar todos os orçamentos  
DELETE FROM public.budgets;

-- 3. Deletar auditoria de exclusões
DELETE FROM public.budget_deletion_audit;

-- 4. Deletar perfis de loja
DELETE FROM public.shop_profiles;

-- 5. Deletar logs administrativos
DELETE FROM public.admin_logs;

-- 6. Deletar perfis de usuário exceto kuky.png@gmail.com
DELETE FROM public.user_profiles 
WHERE id NOT IN (
  SELECT id FROM auth.users WHERE email = 'kuky.png@gmail.com'
);

-- 7. Deletar usuários autenticados exceto kuky.png@gmail.com
DELETE FROM auth.users 
WHERE email != 'kuky.png@gmail.com';

-- 8. Resetar configurações do site (manter apenas 1 registro)
DELETE FROM public.site_settings WHERE id NOT IN (
  SELECT id FROM public.site_settings LIMIT 1
);

-- Relatório final
DO $$
BEGIN
    RAISE NOTICE 'Limpeza concluída. Mantido apenas usuário kuky.png@gmail.com. Todos os orçamentos e dados foram removidos.';
END $$;