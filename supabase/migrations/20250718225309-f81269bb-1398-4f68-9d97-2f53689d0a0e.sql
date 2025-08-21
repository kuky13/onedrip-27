-- Função para prevenir exclusão de clientes padrão
-- Esta função garante que clientes marcados como padrão não possam ser deletados

CREATE OR REPLACE FUNCTION public.prevent_default_client_deletion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o cliente sendo excluído é um cliente padrão
  IF OLD.is_default = TRUE THEN
    RAISE EXCEPTION 'Cliente padrão não pode ser excluído. Clientes padrão são essenciais para o funcionamento do sistema.';
  END IF;
  
  -- Se não for cliente padrão, permitir a exclusão
  RETURN OLD;
END;
$$;

-- Criar trigger que executa a função antes de qualquer exclusão na tabela clients
DROP TRIGGER IF EXISTS prevent_default_client_deletion_trigger ON public.clients;

CREATE TRIGGER prevent_default_client_deletion_trigger
  BEFORE DELETE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_default_client_deletion();

-- Comentário explicativo
COMMENT ON FUNCTION public.prevent_default_client_deletion() IS 
'Função de segurança que impede a exclusão de clientes marcados como padrão (is_default = true). 
Essencial para manter a integridade do sistema e evitar erros em operações que dependem de clientes padrão.';

COMMENT ON TRIGGER prevent_default_client_deletion_trigger ON public.clients IS 
'Trigger de segurança que executa antes de qualquer DELETE na tabela clients para proteger clientes padrão.';