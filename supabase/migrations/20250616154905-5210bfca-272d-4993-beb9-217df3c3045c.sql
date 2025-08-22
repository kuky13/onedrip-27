
-- Adicionar a coluna payment_url se ela não existir
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS payment_url text NOT NULL DEFAULT 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=2c9380849763dae0019775d20c5b05d3';

-- Remover a coluna mercadopago_plan_id
ALTER TABLE public.site_settings 
DROP COLUMN IF EXISTS mercadopago_plan_id;
