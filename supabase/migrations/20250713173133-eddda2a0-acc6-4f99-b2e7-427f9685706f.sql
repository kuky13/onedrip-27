-- CORREÇÃO DE SEGURANÇA - PROJETO OLIVEIRA
-- Etapa 4: Finalização da limpeza e padronização

-- =====================================================
-- LIMPEZA DA TABELA CLIENTS
-- =====================================================

-- Remover políticas muito permissivas de clients
DROP POLICY IF EXISTS "Acesso público para clientes" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "rls_clients_delete" ON public.clients;
DROP POLICY IF EXISTS "rls_clients_insert" ON public.clients;
DROP POLICY IF EXISTS "rls_clients_select" ON public.clients;
DROP POLICY IF EXISTS "rls_clients_update" ON public.clients;

-- Criar políticas restritivas para clients
CREATE POLICY "clients_select_policy" ON public.clients
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "clients_insert_policy" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "clients_update_policy" ON public.clients
  FOR UPDATE USING (auth.uid() IS NOT NULL OR is_current_user_admin());

CREATE POLICY "clients_delete_policy" ON public.clients
  FOR DELETE USING (is_current_user_admin());

-- =====================================================
-- LIMPEZA DA TABELA BRANDS
-- =====================================================

-- Remover políticas restantes de brands
DROP POLICY IF EXISTS "Everyone can view brands" ON public.brands;
DROP POLICY IF EXISTS "Usuários podem ver todas as marcas" ON public.brands;
DROP POLICY IF EXISTS "rls_brands_modify" ON public.brands;
DROP POLICY IF EXISTS "rls_brands_select" ON public.brands;

-- Criar políticas consistentes para brands
CREATE POLICY "brands_select_policy" ON public.brands
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "brands_insert_policy" ON public.brands
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR user_id IS NULL OR is_current_user_admin())
  );

CREATE POLICY "brands_update_policy" ON public.brands
  FOR UPDATE USING (
    (user_id = auth.uid() OR user_id IS NULL) OR 
    is_current_user_admin()
  );

CREATE POLICY "brands_delete_policy" ON public.brands
  FOR DELETE USING (
    (user_id = auth.uid() OR user_id IS NULL) OR 
    is_current_user_admin()
  );

-- =====================================================
-- LIMPEZA DA TABELA DEFECT_TYPES
-- =====================================================

-- Remover políticas permissivas de defect_types
DROP POLICY IF EXISTS "Allow full access to defect_types" ON public.defect_types;
DROP POLICY IF EXISTS "Everyone can view defect types" ON public.defect_types;
DROP POLICY IF EXISTS "Usuários podem ver todos os tipos de defeitos" ON public.defect_types;
DROP POLICY IF EXISTS "rls_defect_types_modify" ON public.defect_types;
DROP POLICY IF EXISTS "rls_defect_types_select" ON public.defect_types;

-- Criar políticas restritivas para defect_types
CREATE POLICY "defect_types_select_policy" ON public.defect_types
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "defect_types_insert_policy" ON public.defect_types
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR is_current_user_admin())
  );

CREATE POLICY "defect_types_update_policy" ON public.defect_types
  FOR UPDATE USING (
    (user_id = auth.uid() OR user_id IS NULL) OR 
    is_current_user_admin()
  );

CREATE POLICY "defect_types_delete_policy" ON public.defect_types
  FOR DELETE USING (
    (user_id = auth.uid() OR user_id IS NULL) OR 
    is_current_user_admin()
  );

-- =====================================================
-- PADRONIZAÇÃO DAS TABELAS DE CONFIGURAÇÃO
-- =====================================================

-- DEVICE_TYPES
DROP POLICY IF EXISTS "Everyone can view device types" ON public.device_types;
DROP POLICY IF EXISTS "rls_device_types_modify" ON public.device_types;
DROP POLICY IF EXISTS "rls_device_types_select" ON public.device_types;

CREATE POLICY "device_types_select_policy" ON public.device_types
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "device_types_modify_policy" ON public.device_types
  FOR ALL USING (is_current_user_admin());

-- PAYMENT_CONDITIONS
DROP POLICY IF EXISTS "Everyone can view payment conditions" ON public.payment_conditions;
DROP POLICY IF EXISTS "rls_payment_conditions_modify" ON public.payment_conditions;
DROP POLICY IF EXISTS "rls_payment_conditions_select" ON public.payment_conditions;

CREATE POLICY "payment_conditions_select_policy" ON public.payment_conditions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "payment_conditions_modify_policy" ON public.payment_conditions
  FOR ALL USING (is_current_user_admin());

-- WARRANTY_PERIODS
DROP POLICY IF EXISTS "Everyone can view warranty periods" ON public.warranty_periods;
DROP POLICY IF EXISTS "rls_warranty_periods_modify" ON public.warranty_periods;
DROP POLICY IF EXISTS "rls_warranty_periods_select" ON public.warranty_periods;

CREATE POLICY "warranty_periods_select_policy" ON public.warranty_periods
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "warranty_periods_modify_policy" ON public.warranty_periods
  FOR ALL USING (is_current_user_admin());