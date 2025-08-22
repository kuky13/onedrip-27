-- Script para criar dados de teste para compartilhamento
-- Insere diretamente nas tabelas para evitar verificações de RLS

-- Primeiro, criar um usuário de teste se não existir
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    '440e8400-e29b-41d4-a716-446655440000',
    'test@example.com',
    '$2a$10$dummy.encrypted.password.hash',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Inserir uma ordem de serviço de teste
INSERT INTO service_orders (
    id,
    owner_id,
    device_type,
    device_model,
    reported_issue,
    status,
    priority,
    total_price,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    '440e8400-e29b-41d4-a716-446655440000',
    'iPhone',
    '14 Pro',
    'Tela quebrada - necessário troca do display',
    'in_progress',
    'high',
    350.00,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserir token de compartilhamento de teste
INSERT INTO service_order_shares (
    id,
    service_order_id,
    share_token,
    expires_at,
    is_active,
    created_at,
    updated_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440000',
    'test-token-123456789',
    NOW() + INTERVAL '30 days',
    true,
    NOW(),
    NOW()
) ON CONFLICT (share_token) DO NOTHING;

-- Inserir informações da empresa de teste
INSERT INTO company_info (
    id,
    owner_id,
    name,
    logo_url,
    address,
    whatsapp_phone,
    created_at,
    updated_at
) VALUES (
    '770e8400-e29b-41d4-a716-446655440000',
    '440e8400-e29b-41d4-a716-446655440000',
    'Oliver Blueberry - Assistência Técnica',
    NULL,
    'Rua das Flores, 123 - Centro',
    '+5511999999999',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Exibir informações para teste
DO $$
BEGIN
    RAISE NOTICE '=== TOKEN DE TESTE CRIADO ===';
    RAISE NOTICE 'Service Order ID: 550e8400-e29b-41d4-a716-446655440000';
    RAISE NOTICE 'Share Token: test-token-123456789';
    RAISE NOTICE 'URL de teste: http://localhost:5173/share/service-order/test-token-123456789';
    RAISE NOTICE '================================';
END $$;