
-- Criar tabela para tipos de dispositivos padronizados
CREATE TABLE IF NOT EXISTS public.device_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir tipos básicos de dispositivos
INSERT INTO public.device_types (name) VALUES 
  ('Smartphone'),
  ('Tablet'),
  ('Notebook'),
  ('Desktop'),
  ('Smartwatch'),
  ('Fone de Ouvido')
ON CONFLICT (name) DO NOTHING;

-- Criar tabela para períodos de garantia
CREATE TABLE IF NOT EXISTS public.warranty_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  months INTEGER NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir períodos de garantia padrão
INSERT INTO public.warranty_periods (months, label) VALUES 
  (1, '1 mês'),
  (3, '3 meses'),
  (6, '6 meses'),
  (12, '1 ano'),
  (24, '2 anos')
ON CONFLICT (months) DO NOTHING;

-- Criar tabela para condições de pagamento
CREATE TABLE IF NOT EXISTS public.payment_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  installments INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir condições de pagamento padrão
INSERT INTO public.payment_conditions (name, installments) VALUES 
  ('À Vista', 1),
  ('2x no Cartão', 2),
  ('3x no Cartão', 3),
  ('6x no Cartão', 6),
  ('12x no Cartão', 12)
ON CONFLICT (name) DO NOTHING;

-- Adicionar novos campos na tabela budgets
ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS payment_condition TEXT DEFAULT 'À Vista',
ADD COLUMN IF NOT EXISTS cash_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS installment_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS includes_delivery BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS includes_screen_protector BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS device_brand TEXT,
ADD COLUMN IF NOT EXISTS part_type TEXT;

-- Melhorar a estrutura da tabela budget_parts
ALTER TABLE public.budget_parts 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id),
ADD COLUMN IF NOT EXISTS part_type TEXT,
ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS cash_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS installment_price NUMERIC(10,2);

-- Criar ou atualizar clientes baseados nos orçamentos existentes
INSERT INTO public.clients (name, phone, email)
SELECT DISTINCT 
  client_name,
  client_phone,
  NULL as email
FROM public.budgets 
WHERE client_name IS NOT NULL 
  AND client_phone IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.phone = budgets.client_phone
  );

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.device_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_conditions ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para as novas tabelas (leitura pública)
CREATE POLICY "Everyone can view device types" ON public.device_types
  FOR SELECT USING (true);

CREATE POLICY "Everyone can view warranty periods" ON public.warranty_periods
  FOR SELECT USING (true);

CREATE POLICY "Everyone can view payment conditions" ON public.payment_conditions
  FOR SELECT USING (true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_budgets_device_model ON public.budgets(device_model);
CREATE INDEX IF NOT EXISTS idx_budgets_client_phone ON public.budgets(client_phone);
CREATE INDEX IF NOT EXISTS idx_budget_parts_brand_id ON public.budget_parts(brand_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);
