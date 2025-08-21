-- 1. Adicionar campo para controlar funcionalidades avançadas na tabela user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN advanced_features_enabled boolean NOT NULL DEFAULT false;

-- 2. Adicionar novos campos na tabela budgets para workflow avançado
ALTER TABLE public.budgets 
ADD COLUMN client_id uuid REFERENCES public.clients(id),
ADD COLUMN workflow_status text NOT NULL DEFAULT 'pending' CHECK (workflow_status IN ('pending', 'approved', 'completed')),
ADD COLUMN expires_at date,
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN payment_confirmed_at timestamp with time zone,
ADD COLUMN is_paid boolean NOT NULL DEFAULT false,
ADD COLUMN is_delivered boolean NOT NULL DEFAULT false,
ADD COLUMN delivery_confirmed_at timestamp with time zone;

-- 3. Criar índices para performance
CREATE INDEX idx_budgets_client_id ON public.budgets(client_id);
CREATE INDEX idx_budgets_workflow_status ON public.budgets(workflow_status);
CREATE INDEX idx_budgets_expires_at ON public.budgets(expires_at);
CREATE INDEX idx_budgets_is_paid ON public.budgets(is_paid);

-- 4. Criar função para calcular data de expiração automaticamente
CREATE OR REPLACE FUNCTION public.set_budget_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := CURRENT_DATE + INTERVAL '15 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para aplicar a função
CREATE TRIGGER set_budget_expiration_trigger
    BEFORE INSERT ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.set_budget_expiration();

-- 6. Criar função para buscar orçamentos vencidos
CREATE OR REPLACE FUNCTION public.get_expiring_budgets(p_user_id uuid)
RETURNS TABLE(
    budget_id uuid,
    client_name text,
    expires_at date,
    days_until_expiry integer
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as budget_id,
        COALESCE(c.name, b.client_name) as client_name,
        b.expires_at,
        (b.expires_at - CURRENT_DATE)::integer as days_until_expiry
    FROM public.budgets b
    LEFT JOIN public.clients c ON b.client_id = c.id
    WHERE b.owner_id = p_user_id 
    AND b.workflow_status = 'pending'
    AND b.expires_at IS NOT NULL
    AND b.expires_at <= CURRENT_DATE + INTERVAL '3 days'
    AND b.deleted_at IS NULL
    ORDER BY b.expires_at ASC;
END;
$$;

-- 7. Atualizar RLS policies para novos campos
-- As policies existentes já cobrem os novos campos pois aplicam a toda a tabela