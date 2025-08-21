-- Função para obter informações da empresa via token de compartilhamento
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
    -- Verificar se o token é válido e obter o owner_id
    SELECT so.owner_id INTO v_owner_id
    FROM service_order_shares sos
    INNER JOIN service_orders so ON sos.service_order_id = so.id
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