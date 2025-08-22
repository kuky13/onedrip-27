-- Verificação e correção de dados de orçamentos para exportação CSV

-- 1. Verificar integridade dos dados atuais
CREATE OR REPLACE FUNCTION public.verify_budget_data_integrity()
RETURNS TABLE(
  issue_type text,
  count_affected bigint,
  description text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Verificar orçamentos sem cash_price (usando total_price)
  RETURN QUERY
  SELECT 
    'missing_cash_price'::text,
    COUNT(*)::bigint,
    'Orçamentos sem cash_price definido'::text
  FROM budgets 
  WHERE cash_price IS NULL AND deleted_at IS NULL;

  -- Verificar orçamentos sem installment_price (deve copiar de cash_price)
  RETURN QUERY
  SELECT 
    'missing_installment_price'::text,
    COUNT(*)::bigint,
    'Orçamentos sem installment_price definido'::text
  FROM budgets 
  WHERE installment_price IS NULL AND deleted_at IS NULL;

  -- Verificar orçamentos com installment_price igual a cash_price quando deveria ser diferente
  RETURN QUERY
  SELECT 
    'installment_equals_cash'::text,
    COUNT(*)::bigint,
    'Orçamentos onde installment_price = cash_price (pode estar incorreto)'::text
  FROM budgets 
  WHERE installment_price = cash_price 
    AND installments > 1 
    AND deleted_at IS NULL;

  -- Verificar orçamentos sem client_name
  RETURN QUERY
  SELECT 
    'missing_client_name'::text,
    COUNT(*)::bigint,
    'Orçamentos sem nome do cliente'::text
  FROM budgets 
  WHERE (client_name IS NULL OR client_name = '') AND deleted_at IS NULL;

  -- Verificar orçamentos com valores em escala incorreta (muito altos - podem estar em centavos)
  RETURN QUERY
  SELECT 
    'values_too_high'::text,
    COUNT(*)::bigint,
    'Orçamentos com valores suspeitos (>100000 - podem estar em centavos)'::text
  FROM budgets 
  WHERE (total_price > 100000 OR cash_price > 100000 OR installment_price > 100000)
    AND deleted_at IS NULL;
END;
$$;

-- 2. Função para corrigir dados de orçamentos
CREATE OR REPLACE FUNCTION public.fix_budget_data_for_export()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  fixed_count integer := 0;
  result jsonb;
BEGIN
  -- Verificar se é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem executar correções de dados';
  END IF;

  -- 1. Corrigir cash_price ausente (copiar de total_price)
  UPDATE budgets 
  SET cash_price = total_price
  WHERE cash_price IS NULL 
    AND total_price IS NOT NULL 
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  
  -- 2. Corrigir installment_price ausente (copiar de cash_price com pequeno acréscimo)
  UPDATE budgets 
  SET installment_price = CASE 
    WHEN installments > 1 THEN cash_price * 1.05  -- 5% de acréscimo para parcelado
    ELSE cash_price  -- Mesmo valor se for à vista
  END
  WHERE installment_price IS NULL 
    AND cash_price IS NOT NULL 
    AND deleted_at IS NULL;

  -- 3. Corrigir client_name ausente
  UPDATE budgets 
  SET client_name = 'Cliente não informado'
  WHERE (client_name IS NULL OR client_name = '') 
    AND deleted_at IS NULL;

  -- 4. Garantir que installments tenha valor padrão
  UPDATE budgets 
  SET installments = 1
  WHERE installments IS NULL 
    AND deleted_at IS NULL;

  -- 5. Garantir que payment_condition tenha valor padrão
  UPDATE budgets 
  SET payment_condition = 'À Vista'
  WHERE payment_condition IS NULL 
    AND deleted_at IS NULL;

  -- 6. Garantir que warranty_months tenha valor padrão
  UPDATE budgets 
  SET warranty_months = 3
  WHERE warranty_months IS NULL 
    AND deleted_at IS NULL;

  -- Preparar resultado
  SELECT jsonb_build_object(
    'success', true,
    'message', 'Dados corrigidos com sucesso',
    'timestamp', now()
  ) INTO result;

  RETURN result;
END;
$$;

-- 3. Função para obter estatísticas completas dos orçamentos
CREATE OR REPLACE FUNCTION public.get_budget_export_stats()
RETURNS TABLE(
  total_budgets bigint,
  with_cash_price bigint,
  with_installment_price bigint,
  with_client_name bigint,
  with_phone bigint,
  with_part_quality bigint,
  with_notes bigint,
  avg_cash_price numeric,
  avg_installment_price numeric,
  min_cash_price numeric,
  max_cash_price numeric
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    COUNT(*) as total_budgets,
    COUNT(cash_price) as with_cash_price,
    COUNT(installment_price) as with_installment_price,
    COUNT(CASE WHEN client_name IS NOT NULL AND client_name != '' THEN 1 END) as with_client_name,
    COUNT(client_phone) as with_phone,
    COUNT(part_quality) as with_part_quality,
    COUNT(notes) as with_notes,
    AVG(cash_price) as avg_cash_price,
    AVG(installment_price) as avg_installment_price,
    MIN(cash_price) as min_cash_price,
    MAX(cash_price) as max_cash_price
  FROM budgets 
  WHERE deleted_at IS NULL;
$$;