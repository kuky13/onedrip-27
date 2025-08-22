-- Migração para remover completamente as funcionalidades de tipos de serviço, status personalizados e configurações WhatsApp

-- Remover triggers primeiro
DROP TRIGGER IF EXISTS update_service_types_updated_at ON service_types;
DROP TRIGGER IF EXISTS update_custom_statuses_updated_at ON custom_statuses;
DROP TRIGGER IF EXISTS update_whatsapp_settings_updated_at ON whatsapp_settings;

-- Remover funções RPC
DROP FUNCTION IF EXISTS update_service_order_status_contextual(UUID, VARCHAR(50));
DROP FUNCTION IF EXISTS generate_whatsapp_share_link(VARCHAR(255));

-- Remover função de trigger (se não for usada por outras tabelas)
-- Verificar se a função update_updated_at_column é usada em outras tabelas antes de remover
-- DROP FUNCTION IF EXISTS update_updated_at_column();

-- Remover políticas de segurança para service_types
DROP POLICY IF EXISTS "service_types_select_policy" ON service_types;
DROP POLICY IF EXISTS "service_types_insert_policy" ON service_types;
DROP POLICY IF EXISTS "service_types_update_policy" ON service_types;
DROP POLICY IF EXISTS "service_types_delete_policy" ON service_types;

-- Remover políticas de segurança para custom_statuses
DROP POLICY IF EXISTS "custom_statuses_select_policy" ON custom_statuses;
DROP POLICY IF EXISTS "custom_statuses_insert_policy" ON custom_statuses;
DROP POLICY IF EXISTS "custom_statuses_update_policy" ON custom_statuses;
DROP POLICY IF EXISTS "custom_statuses_delete_policy" ON custom_statuses;

-- Remover políticas de segurança para whatsapp_settings
DROP POLICY IF EXISTS "whatsapp_settings_select_policy" ON whatsapp_settings;
DROP POLICY IF EXISTS "whatsapp_settings_insert_policy" ON whatsapp_settings;
DROP POLICY IF EXISTS "whatsapp_settings_update_policy" ON whatsapp_settings;
DROP POLICY IF EXISTS "whatsapp_settings_delete_policy" ON whatsapp_settings;

-- Revogar permissões
REVOKE ALL PRIVILEGES ON service_types FROM anon;
REVOKE ALL PRIVILEGES ON service_types FROM authenticated;

REVOKE ALL PRIVILEGES ON custom_statuses FROM anon;
REVOKE ALL PRIVILEGES ON custom_statuses FROM authenticated;

REVOKE ALL PRIVILEGES ON whatsapp_settings FROM anon;
REVOKE ALL PRIVILEGES ON whatsapp_settings FROM authenticated;

-- Remover tabelas (ordem importante devido às foreign keys)
-- Primeiro remover a referência circular em custom_statuses
ALTER TABLE custom_statuses DROP CONSTRAINT IF EXISTS custom_statuses_next_status_id_fkey;

-- Remover as tabelas
DROP TABLE IF EXISTS service_types CASCADE;
DROP TABLE IF EXISTS custom_statuses CASCADE;
DROP TABLE IF EXISTS whatsapp_settings CASCADE;

-- Comentário final
-- Esta migração remove completamente as funcionalidades de:
-- 1. Tipos de Serviço (service_types)
-- 2. Status Personalizados (custom_statuses)
-- 3. Configurações WhatsApp (whatsapp_settings)
-- Incluindo todas as funções RPC, triggers, políticas e permissões relacionadas