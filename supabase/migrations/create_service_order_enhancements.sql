-- Criação das tabelas para melhorias nas Ordens de Serviço

-- Tabela para tipos de serviço personalizados
CREATE TABLE IF NOT EXISTS service_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Cor em hexadecimal
    icon VARCHAR(50) DEFAULT 'wrench', -- Nome do ícone Lucide
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para status personalizados
CREATE TABLE IF NOT EXISTS custom_statuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280', -- Cor em hexadecimal
    icon VARCHAR(50) DEFAULT 'circle', -- Nome do ícone Lucide
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    status_type VARCHAR(20) DEFAULT 'custom', -- 'default', 'custom'
    next_status_id UUID REFERENCES custom_statuses(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    welcome_message TEXT DEFAULT 'Olá! Aqui está o status da sua ordem de serviço:',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir status padrão do sistema
INSERT INTO custom_statuses (name, description, color, icon, status_type, sort_order) VALUES
('Aberto', 'Ordem de serviço criada e aguardando início', '#EF4444', 'clock', 'default', 1),
('Em Andamento', 'Serviço sendo executado', '#F59E0B', 'play-circle', 'default', 2),
('Concluído', 'Serviço finalizado', '#10B981', 'check-circle', 'default', 3),
('Entregue', 'Produto entregue ao cliente', '#3B82F6', 'package-check', 'default', 4);

-- Inserir tipos de serviço padrão
INSERT INTO service_types (name, description, color, icon, sort_order) VALUES
('Reparo Geral', 'Serviços de reparo em geral', '#3B82F6', 'wrench', 1),
('Manutenção', 'Serviços de manutenção preventiva', '#10B981', 'settings', 2),
('Instalação', 'Serviços de instalação de equipamentos', '#F59E0B', 'plug', 3),
('Consultoria', 'Serviços de consultoria técnica', '#8B5CF6', 'lightbulb', 4);

-- Inserir configuração padrão do WhatsApp
INSERT INTO whatsapp_settings (phone_number, welcome_message) VALUES
('+5511999999999', 'Olá! Aqui está o status da sua ordem de serviço:');

-- Habilitar RLS (Row Level Security)
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para service_types
CREATE POLICY "service_types_select_policy" ON service_types
    FOR SELECT USING (true);

CREATE POLICY "service_types_insert_policy" ON service_types
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "service_types_update_policy" ON service_types
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "service_types_delete_policy" ON service_types
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas de segurança para custom_statuses
CREATE POLICY "custom_statuses_select_policy" ON custom_statuses
    FOR SELECT USING (true);

CREATE POLICY "custom_statuses_insert_policy" ON custom_statuses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "custom_statuses_update_policy" ON custom_statuses
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "custom_statuses_delete_policy" ON custom_statuses
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas de segurança para whatsapp_settings
CREATE POLICY "whatsapp_settings_select_policy" ON whatsapp_settings
    FOR SELECT USING (true);

CREATE POLICY "whatsapp_settings_insert_policy" ON whatsapp_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "whatsapp_settings_update_policy" ON whatsapp_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "whatsapp_settings_delete_policy" ON whatsapp_settings
    FOR DELETE USING (auth.role() = 'authenticated');

-- Conceder permissões para os roles anon e authenticated
GRANT SELECT ON service_types TO anon;
GRANT ALL PRIVILEGES ON service_types TO authenticated;

GRANT SELECT ON custom_statuses TO anon;
GRANT ALL PRIVILEGES ON custom_statuses TO authenticated;

GRANT SELECT ON whatsapp_settings TO anon;
GRANT ALL PRIVILEGES ON whatsapp_settings TO authenticated;

-- Função RPC para atualizar status de forma contextual
CREATE OR REPLACE FUNCTION update_service_order_status_contextual(
    order_id UUID,
    new_status VARCHAR(50)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    current_status VARCHAR(50);
BEGIN
    -- Verificar status atual
    SELECT status INTO current_status
    FROM service_orders
    WHERE id = order_id;
    
    IF current_status IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Ordem de serviço não encontrada');
    END IF;
    
    -- Atualizar status
    UPDATE service_orders
    SET status = new_status,
        updated_at = NOW()
    WHERE id = order_id;
    
    -- Retornar resultado
    SELECT json_build_object(
        'success', true,
        'order_id', order_id,
        'old_status', current_status,
        'new_status', new_status,
        'updated_at', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Função RPC para gerar link de compartilhamento WhatsApp
CREATE OR REPLACE FUNCTION generate_whatsapp_share_link(
    order_token VARCHAR(255)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    phone_number VARCHAR(20);
    welcome_msg TEXT;
    share_url TEXT;
BEGIN
    -- Buscar configurações do WhatsApp
    SELECT ws.phone_number, ws.welcome_message
    INTO phone_number, welcome_msg
    FROM whatsapp_settings ws
    WHERE ws.is_active = true
    LIMIT 1;
    
    IF phone_number IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Configurações do WhatsApp não encontradas');
    END IF;
    
    -- Construir URL de compartilhamento
    share_url := 'https://wa.me/' || REPLACE(phone_number, '+', '') || '?text=' || 
                 encode(welcome_msg || ' ' || 'https://yourapp.com/share/service-order/' || order_token, 'escape');
    
    -- Retornar resultado
    SELECT json_build_object(
        'success', true,
        'whatsapp_url', share_url,
        'phone_number', phone_number,
        'message', welcome_msg
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_types_updated_at BEFORE UPDATE ON service_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_statuses_updated_at BEFORE UPDATE ON custom_statuses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_settings_updated_at BEFORE UPDATE ON whatsapp_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();