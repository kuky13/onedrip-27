-- Limpeza completa de todos os dados de usuários
-- ⚠️ ATENÇÃO: Esta operação irá deletar TODOS os dados de usuários e não pode ser desfeita!

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

-- 6. Deletar rankings de jogos
DELETE FROM public.ranking_invaders;

-- 7. Deletar clientes
DELETE FROM public.clients;

-- 8. Deletar imagens administrativas
DELETE FROM public.admin_images;

-- 9. Deletar perfis de usuário
DELETE FROM public.user_profiles;

-- 10. Deletar usuários autenticados (auth.users)
-- NOTA: Esta operação remove os usuários do sistema de autenticação
DELETE FROM auth.users;

-- 11. Resetar configurações do site para valores padrão
UPDATE public.site_settings 
SET 
  page_title = 'Escolha seu Plano',
  page_subtitle = 'Tenha acesso completo ao sistema de gestão de orçamentos mais eficiente para assistências técnicas.',
  plan_name = 'Plano Profissional',
  plan_price = 15,
  plan_currency = 'R$',
  plan_period = '/mês',
  updated_at = NOW()
WHERE id IS NOT NULL;

-- Relatório final
DO $$
BEGIN
    RAISE NOTICE 'Limpeza completa realizada! Todos os dados de usuários foram removidos do sistema.';
    RAISE NOTICE 'Próximo passo: Criar um novo usuário admin através do painel de autenticação do Supabase.';
END $$;