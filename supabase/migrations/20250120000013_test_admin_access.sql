-- Teste de acesso administrativo
-- Verificar se usuários admin conseguem acessar área administrativa

-- 1. Verificar usuários admin existentes
SELECT 
    'Usuários Admin Existentes:' as info,
    id,
    name,
    role,
    created_at
FROM user_profiles 
WHERE role = 'admin'
ORDER BY created_at;

-- 2. Testar função is_current_user_admin para cada usuário admin
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
        
        RAISE NOTICE 'Usuário Admin: % (ID: %) - Função retorna: %', 
            admin_user.name, admin_user.id, test_result;
    END LOOP;
END $$;

-- 3. Verificar permissões da tabela user_profiles
SELECT 
    'Permissões da tabela user_profiles:' as info,
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- 4. Verificar se RLS está habilitado
SELECT 
    'Status RLS:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'user_profiles';

-- 5. Verificar políticas RLS da tabela user_profiles
SELECT 
    'Políticas RLS:' as info,
    policyname,
    cmd,
    permissive,
    roles,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'user_profiles'
ORDER BY policyname;

-- 6. Teste direto de acesso aos dados do perfil para usuário admin
DO $$
DECLARE
    admin_user RECORD;
    profile_data RECORD;
BEGIN
    FOR admin_user IN 
        SELECT id, name FROM user_profiles WHERE role = 'admin' LIMIT 1
    LOOP
        -- Simular contexto do usuário admin
        PERFORM set_config('request.jwt.claims', 
            json_build_object('sub', admin_user.id)::text, true);
        
        -- Tentar acessar próprio perfil
        SELECT * INTO profile_data
        FROM user_profiles 
        WHERE id = admin_user.id;
        
        IF FOUND THEN
            RAISE NOTICE 'Usuário Admin % consegue acessar próprio perfil: ID=%, Role=%', 
                admin_user.name, profile_data.id, profile_data.role;
        ELSE
            RAISE NOTICE 'ERRO: Usuário Admin % NÃO consegue acessar próprio perfil!', 
                admin_user.name;
        END IF;
    END LOOP;
END $$;

-- 7. Limpar configuração de contexto
SELECT set_config('request.jwt.claims', NULL, true);

-- Resultado final
SELECT 'Teste de acesso administrativo concluído!' as resultado;