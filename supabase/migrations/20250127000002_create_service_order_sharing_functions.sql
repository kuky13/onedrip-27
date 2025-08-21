-- Migração para funções RPC de compartilhamento de status de Ordens de Serviço VIP
-- Cria funções para geração e validação de tokens

-- Função para gerar token de compartilhamento
CREATE OR REPLACE FUNCTION generate_service_order_share_token(
    p_service_order_id UUID
)
RETURNS TABLE (
    share_token TEXT,
    share_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
AS $$
DECLARE
    v_token TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_base_url TEXT := 'https://kuky.pro';
BEGIN
    -- Verificar se o usuário tem acesso à OS
    IF NOT EXISTS (
        SELECT 1 FROM service_orders 
        WHERE id = p_service_order_id 
        AND owner_id = auth.uid()
        AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Ordem de serviço não encontrada ou sem permissão';
    END IF;
    
    -- Desativar tokens existentes
    UPDATE service_order_shares 
    SET is_active = false 
    WHERE service_order_id = p_service_order_id;
    
    -- Criar novo token
    INSERT INTO service_order_shares (service_order_id)
    VALUES (p_service_order_id)
    RETURNING service_order_shares.share_token, service_order_shares.expires_at INTO v_token, v_expires_at;
    
    RETURN QUERY SELECT 
        v_token,
        v_base_url || '/share/service-order/' || v_token,
        v_expires_at;
END;
$$ LANGUAGE plpgsql;

-- Função para obter OS via token
CREATE OR REPLACE FUNCTION get_service_order_by_share_token(
    p_share_token TEXT
)
RETURNS TABLE (
    id UUID,
    formatted_id TEXT,
    device_type VARCHAR,
    device_model VARCHAR,
    reported_issue TEXT,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o token é válido
    IF NOT EXISTS (
        SELECT 1 FROM service_order_shares 
        WHERE share_token = p_share_token 
        AND is_active = true 
        AND expires_at > NOW()
    ) THEN
        RAISE EXCEPTION 'Token inválido ou expirado';
    END IF;
    
    RETURN QUERY
    SELECT 
        so.id,
        'OS: #' || SUBSTRING(so.id::text, 1, 8) as formatted_id,
        so.device_type,
        so.device_model,
        so.reported_issue,
        so.status,
        so.created_at,
        so.updated_at
    FROM service_orders so
    INNER JOIN service_order_shares sos ON so.id = sos.service_order_id
    WHERE sos.share_token = p_share_token
    AND sos.is_active = true
    AND sos.expires_at > NOW()
    AND so.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Função para obter informações da empresa
CREATE OR REPLACE FUNCTION get_company_info(
    p_owner_id UUID DEFAULT NULL
)
RETURNS TABLE (
    name VARCHAR,
    logo_url TEXT,
    address TEXT,
    whatsapp_phone VARCHAR
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ci.name, 'Oliver Blueberry') as name,
        ci.logo_url,
        ci.address,
        ci.whatsapp_phone
    FROM company_info ci
    WHERE ci.owner_id = COALESCE(p_owner_id, auth.uid())
    UNION ALL
    SELECT 
        'Oliver Blueberry'::VARCHAR,
        NULL::TEXT,
        NULL::TEXT,
        NULL::VARCHAR
    WHERE NOT EXISTS (
        SELECT 1 FROM company_info 
        WHERE owner_id = COALESCE(p_owner_id, auth.uid())
    )
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Função para obter informações da empresa via token (para página pública)
CREATE OR REPLACE FUNCTION get_company_info_by_share_token(
    p_share_token TEXT
)
RETURNS TABLE (
    name VARCHAR,
    logo_url TEXT,
    address TEXT,
    whatsapp_phone VARCHAR
)
SECURITY DEFINER
AS $$
DECLARE
    v_owner_id UUID;
BEGIN
    -- Verificar se o token é válido e obter owner_id
    SELECT so.owner_id INTO v_owner_id
    FROM service_orders so
    INNER JOIN service_order_shares sos ON so.id = sos.service_order_id
    WHERE sos.share_token = p_share_token
    AND sos.is_active = true
    AND sos.expires_at > NOW()
    AND so.deleted_at IS NULL;
    
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Token inválido ou expirado';
    END IF;
    
    RETURN QUERY
    SELECT 
        COALESCE(ci.name, 'Oliver Blueberry') as name,
        ci.logo_url,
        ci.address,
        ci.whatsapp_phone
    FROM company_info ci
    WHERE ci.owner_id = v_owner_id
    UNION ALL
    SELECT 
        'Oliver Blueberry'::VARCHAR,
        NULL::TEXT,
        NULL::TEXT,
        NULL::VARCHAR
    WHERE NOT EXISTS (
        SELECT 1 FROM company_info 
        WHERE owner_id = v_owner_id
    )
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON FUNCTION generate_service_order_share_token(UUID) IS 'Gera token único para compartilhamento de OS VIP';
COMMENT ON FUNCTION get_service_order_by_share_token(TEXT) IS 'Obtém dados da OS via token de compartilhamento';
COMMENT ON FUNCTION get_company_info(UUID) IS 'Obtém informações da empresa do usuário';
COMMENT ON FUNCTION get_company_info_by_share_token(TEXT) IS 'Obtém informações da empresa via token público';