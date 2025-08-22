
-- Adicionar campo de validade aos orçamentos (calculado na inserção)
ALTER TABLE public.budgets 
ADD COLUMN valid_until DATE;

-- Tornar campos de cliente opcionais
ALTER TABLE public.budgets 
ALTER COLUMN client_name DROP NOT NULL,
ALTER COLUMN client_phone DROP NOT NULL;

-- Atualizar orçamentos existentes para ter a data de validade (15 dias após criação)
UPDATE public.budgets 
SET valid_until = DATE(created_at) + INTERVAL '15 days'
WHERE valid_until IS NULL;

-- Atualizar orçamentos existentes para ter campos de cliente como NULL se estiverem vazios
UPDATE public.budgets 
SET client_name = NULL 
WHERE client_name = '' OR client_name IS NULL;

UPDATE public.budgets 
SET client_phone = NULL 
WHERE client_phone = '' OR client_phone IS NULL;

-- Criar função para calcular data de validade automaticamente
CREATE OR REPLACE FUNCTION set_budget_valid_until()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.valid_until IS NULL THEN
    NEW.valid_until := DATE(NEW.created_at) + INTERVAL '15 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para definir data de validade automaticamente
CREATE TRIGGER budget_set_valid_until
  BEFORE INSERT ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION set_budget_valid_until();
