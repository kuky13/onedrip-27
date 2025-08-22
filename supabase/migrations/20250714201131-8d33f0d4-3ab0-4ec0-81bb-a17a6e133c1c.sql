-- Melhorias na tabela de clientes
-- Adicionar campos essenciais para um sistema completo de gestão de clientes
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Criar índices apenas se não existirem
CREATE INDEX IF NOT EXISTS idx_clients_name_search ON public.clients USING gin(to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_clients_is_favorite ON public.clients (is_favorite);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON public.clients USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_clients_default ON public.clients (is_default);

-- Função para impedir exclusão de clientes padrão
CREATE OR REPLACE FUNCTION prevent_default_client_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_default = TRUE THEN
    RAISE EXCEPTION 'Cliente padrão não pode ser excluído';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger apenas se não existir
DROP TRIGGER IF EXISTS trigger_prevent_default_client_deletion ON public.clients;
CREATE TRIGGER trigger_prevent_default_client_deletion
  BEFORE DELETE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION prevent_default_client_deletion();

-- Função para contar orçamentos por cliente
CREATE OR REPLACE FUNCTION get_client_budget_count(client_id UUID)
RETURNS INTEGER AS $$
DECLARE
  budget_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO budget_count
  FROM public.budgets
  WHERE client_id = get_client_budget_count.client_id
  AND deleted_at IS NULL;
  
  RETURN COALESCE(budget_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;