-- Migração para remover device_brand e ajustar estrutura

-- 1. Remover a coluna device_brand da tabela budgets
ALTER TABLE public.budgets DROP COLUMN IF EXISTS device_brand;

-- 2. Atualizar dados existentes - mover issue para part_quality se necessário
UPDATE public.budgets 
SET part_quality = COALESCE(part_quality, issue)
WHERE part_quality IS NULL AND issue IS NOT NULL;

-- 3. Remover e recriar a função get_budgets_with_part_quality
DROP FUNCTION IF EXISTS public.get_budgets_with_part_quality(uuid);

CREATE OR REPLACE FUNCTION public.get_budgets_with_part_quality(p_user_id uuid)
RETURNS TABLE(
  id uuid, 
  client_name text, 
  client_phone text, 
  device_type text, 
  device_model text, 
  issue text, 
  part_quality text, 
  status text, 
  workflow_status text, 
  total_price numeric, 
  cash_price numeric, 
  installment_price numeric, 
  delivery_date date, 
  expires_at date, 
  valid_until date, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  is_paid boolean, 
  is_delivered boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.client_name,
    b.client_phone,
    b.device_type,
    b.device_model,
    b.issue,
    b.part_quality,
    b.status,
    b.workflow_status,
    b.total_price,
    b.cash_price,
    b.installment_price,
    b.delivery_date,
    b.expires_at,
    b.valid_until,
    b.created_at,
    b.updated_at,
    b.is_paid,
    b.is_delivered
  FROM public.budgets b
  WHERE b.owner_id = p_user_id 
    AND b.deleted_at IS NULL
  ORDER BY b.created_at DESC;
END;
$function$;