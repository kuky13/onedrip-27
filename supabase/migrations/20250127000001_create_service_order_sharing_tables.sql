-- Migração para funcionalidade de compartilhamento de status de Ordens de Serviço VIP
-- Cria tabelas service_order_shares e company_info

-- Criar tabela para tokens de compartilhamento
CREATE TABLE service_order_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    share_token VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_service_order_shares_token ON service_order_shares(share_token);
CREATE INDEX idx_service_order_shares_service_order_id ON service_order_shares(service_order_id);
CREATE INDEX idx_service_order_shares_expires_at ON service_order_shares(expires_at);

-- Trigger para updated_at
CREATE TRIGGER update_service_order_shares_updated_at
    BEFORE UPDATE ON service_order_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela para informações da empresa
CREATE TABLE company_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Oliver Blueberry',
    logo_url TEXT,
    address TEXT,
    whatsapp_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id)
);

-- Trigger para updated_at
CREATE TRIGGER update_company_info_updated_at
    BEFORE UPDATE ON company_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS para service_order_shares
ALTER TABLE service_order_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own service order shares" ON service_order_shares
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM service_orders 
            WHERE id = service_order_id 
            AND owner_id = auth.uid()
        )
    );

-- RLS para company_info
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own company info" ON company_info
    FOR ALL USING (owner_id = auth.uid());

-- Comentários para documentação
COMMENT ON TABLE service_order_shares IS 'Tokens de compartilhamento para ordens de serviço VIP';
COMMENT ON TABLE company_info IS 'Informações da empresa para exibição pública';
COMMENT ON COLUMN service_order_shares.share_token IS 'Token único para acesso público à OS';
COMMENT ON COLUMN service_order_shares.expires_at IS 'Data de expiração do token (padrão: 30 dias)';
COMMENT ON COLUMN company_info.whatsapp_phone IS 'Telefone WhatsApp para contato direto';