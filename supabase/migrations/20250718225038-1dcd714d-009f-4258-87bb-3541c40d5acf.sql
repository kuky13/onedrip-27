-- Limpeza completa de todos os dados de usuários (versão 3)
-- ⚠️ ATENÇÃO: Esta operação irá deletar TODOS os dados de usuários e não pode ser desfeita!

-- Remover a função que impede a exclusão de clientes padrão
DROP TRIGGER IF EXISTS prevent_default_client_deletion_trigger ON public.clients;
DROP FUNCTION IF EXISTS public.prevent_default_client_deletion() CASCADE;

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

-- Recriar a função e trigger de proteção
CREATE OR REPLACE FUNCTION public.prevent_default_client_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_default = TRUE THEN
    RAISE EXCEPTION 'Cliente padrão não pode ser excluído';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_default_client_deletion_trigger
  BEFORE DELETE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_default_client_deletion();

-- Relatório final
DO $$
BEGIN
    RAISE NOTICE '✅ Limpeza completa realizada! Todos os dados de usuários foram removidos do sistema.';
    RAISE NOTICE '📋 Sistema limpo: 0 usuários, 0 orçamentos, 0 clientes.';
    RAISE NOTICE '🔧 Proteções do sistema foram restauradas.';
END $$;