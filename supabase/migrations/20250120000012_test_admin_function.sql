-- Testar função is_current_user_admin

-- 1. Verificar se a função existe e está funcionando
SELECT 
  routine_name,
  routine_type,
  'FUNÇÃO EXISTE' as status
FROM information_schema.routines 
WHERE routine_name = 'is_current_user_admin' 
  AND routine_schema = 'public';

-- 2. Testar a função para cada usuário
DO $$
DECLARE
  user_record RECORD;
  is_admin_result BOOLEAN;
  test_count INTEGER := 0;
  admin_test_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Iniciando teste da função is_current_user_admin...';
  
  FOR user_record IN 
    SELECT id, name, role FROM public.user_profiles ORDER BY created_at
  LOOP
    test_count := test_count + 1;
    
    -- Simular contexto de autenticação para este usuário
    PERFORM set_config('request.jwt.claims', 
      json_build_object('sub', user_record.id::text)::text, true);
    
    -- Testar a função
    BEGIN
      SELECT public.is_current_user_admin() INTO is_admin_result;
      
      RAISE NOTICE 'Teste %: Usuário % (%) - Role: % - is_admin(): %', 
        test_count,
        user_record.name, 
        user_record.id, 
        user_record.role, 
        COALESCE(is_admin_result::text, 'NULL');
        
      -- Contar quantos admins foram detectados
      IF is_admin_result = true THEN
        admin_test_count := admin_test_count + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'ERRO ao testar usuário %: %', user_record.name, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Resumo dos testes:';
  RAISE NOTICE '- Total de usuários testados: %', test_count;
  RAISE NOTICE '- Usuários detectados como admin: %', admin_test_count;
  
  -- Limpar configuração
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

-- 3. Verificar usuários admin na tabela
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as usuarios_admin,
  string_agg(CASE WHEN role = 'admin' THEN name END, ', ') as nomes_admin
FROM public.user_profiles;

-- 4. Testar função sem contexto de usuário (deve retornar false)
DO $$
DECLARE
  result_without_user BOOLEAN;
BEGIN
  -- Limpar qualquer contexto de usuário
  PERFORM set_config('request.jwt.claims', NULL, true);
  
  -- Testar função
  SELECT public.is_current_user_admin() INTO result_without_user;
  
  RAISE NOTICE 'Teste sem usuário autenticado: %', COALESCE(result_without_user::text, 'NULL');
END $$;