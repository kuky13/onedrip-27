-- Migração para renomear campo service_orders_beta_enabled para service_orders_vip_enabled
-- Data: 2025-01-17
-- Descrição: Altera a nomenclatura de 'beta' para 'vip' no sistema de ordens de serviço

-- Renomear coluna na tabela user_profiles
ALTER TABLE user_profiles 
RENAME COLUMN service_orders_beta_enabled TO service_orders_vip_enabled;

-- Atualizar comentário da coluna
COMMENT ON COLUMN user_profiles.service_orders_vip_enabled IS 'Indica se o usuário tem acesso VIP às funcionalidades de ordens de serviço';

-- Verificar se existem políticas RLS que precisam ser atualizadas
-- Atualizar políticas que referenciam o campo antigo
DROP POLICY IF EXISTS "Users can view their own service orders" ON service_orders;
DROP POLICY IF EXISTS "Users can create service orders if they have VIP access" ON service_orders;
DROP POLICY IF EXISTS "Users can update their own service orders" ON service_orders;
DROP POLICY IF EXISTS "Users can delete their own service orders" ON service_orders;

-- Recriar políticas com a nova nomenclatura
CREATE POLICY "Users can view their own service orders" ON service_orders
    FOR SELECT USING (
        owner_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (service_orders_vip_enabled = true OR role = 'admin')
        )
    );

CREATE POLICY "Users can create service orders if they have VIP access" ON service_orders
    FOR INSERT WITH CHECK (
        owner_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (service_orders_vip_enabled = true OR role = 'admin')
        )
    );

CREATE POLICY "Users can update their own service orders" ON service_orders
    FOR UPDATE USING (
        owner_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (service_orders_vip_enabled = true OR role = 'admin')
        )
    );

CREATE POLICY "Users can delete their own service orders" ON service_orders
    FOR DELETE USING (
        owner_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (service_orders_vip_enabled = true OR role = 'admin')
        )
    );