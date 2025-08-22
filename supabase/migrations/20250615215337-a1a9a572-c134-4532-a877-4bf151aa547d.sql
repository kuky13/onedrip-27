
-- Remove a tabela de pagamentos primeiro, pois ela depende da tabela de assinaturas.
DROP TABLE IF EXISTS public.payments;

-- Agora, remove a tabela de assinaturas.
DROP TABLE IF EXISTS public.subscriptions;
