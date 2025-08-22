-- Garantir que existe pelo menos um usuário admin para teste
-- Esta migração cria um usuário admin se não existir nenhum

DO $$
DECLARE
    admin_count INTEGER;
    first_user_id UUID;
BEGIN
    -- Verificar quantos admins existem
    SELECT COUNT(*) INTO admin_count
    FROM user_profiles 
    WHERE role = 'admin';
    
    RAISE NOTICE 'Número de usuários admin encontrados: %', admin_count;
    
    -- Se não há admins, promover o primeiro usuário
    IF admin_count = 0 THEN
        -- Buscar o primeiro usuário criado
        SELECT id INTO first_user_id
        FROM user_profiles 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        IF first_user_id IS NOT NULL THEN
            -- Promover para admin
            UPDATE user_profiles 
            SET role = 'admin'
            WHERE id = first_user_id;
            
            RAISE NOTICE 'Usuário % promovido para admin', first_user_id;
        ELSE
            RAISE NOTICE 'Nenhum usuário encontrado para promover';
        END IF;
    ELSE
        RAISE NOTICE 'Já existem % usuários admin no sistema', admin_count;
    END IF;
END $$;

-- Verificar resultado final
SELECT 
    'Usuários Admin após migração:' as info,
    id,
    name,
    role,
    created_at
FROM user_profiles 
WHERE role = 'admin'
ORDER BY created_at;

-- Testar função is_current_user_admin para usuários admin
DO $$
DECLARE
    admin_user RECORD;
    test_result BOOLEAN;
BEGIN
    FOR admin_user IN 
        SELECT id, name FROM user_profiles WHERE role = 'admin'
    LOOP
        -- Simular contexto do usuário admin
        PERFORM set_config('request.jwt.claims', 
            json_build_object('sub', admin_user.id)::text, true);
        
        -- Testar função
        SELECT public.is_current_user_admin() INTO test_result;
        
        RAISE NOTICE 'Teste final - Usuário Admin: % (ID: %) - Função retorna: %', 
            admin_user.name, admin_user.id, test_result;
    END LOOP;
    
    -- Limpar configuração
    PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

SELECT 'Migração de garantia de usuário admin concluída!' as resultado;