-- Melhorias na tabela de clientes
-- Adicionar campos essenciais para um sistema completo de gestão de clientes
ALTER TABLE public.clients
ADD COLUMN address TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN zip_code TEXT,
ADD COLUMN notes TEXT,
ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN tags TEXT[],
ADD COLUMN is_default BOOLEAN DEFAULT FALSE;

-- Criar índices para melhor performance
CREATE INDEX idx_clients_name ON public.clients USING gin(to_tsvector('portuguese', name));
CREATE INDEX idx_clients_phone ON public.clients (phone);
CREATE INDEX idx_clients_is_favorite ON public.clients (is_favorite);
CREATE INDEX idx_clients_tags ON public.clients USING gin(tags);

-- Criar um cliente padrão para cada usuário (que não pode ser excluído)
CREATE OR REPLACE FUNCTION create_default_client_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se já existe um cliente padrão para este usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.clients 
    WHERE is_default = TRUE 
    AND created_at >= NEW.created_at - INTERVAL '1 minute'
  ) THEN
    INSERT INTO public.clients (
      name, 
      phone, 
      address,
      notes,
      is_default
    ) VALUES (
      'Cliente Padrão',
      '(00) 00000-0000',
      'Endereço não informado',
      'Cliente padrão do sistema - não pode ser excluído',
      TRUE
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar cliente padrão automaticamente
CREATE TRIGGER trigger_create_default_client
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_client_for_user();

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

-- Trigger para impedir exclusão de clientes padrão
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