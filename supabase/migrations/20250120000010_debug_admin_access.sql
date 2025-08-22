-- Debug admin access issues

-- 1. Verificar usuários admin existentes
SELECT 
  id,
  name,
  role,
  created_at,
  CASE 
    WHEN role = 'admin' THEN 'É ADMIN'
    ELSE 'NÃO É ADMIN'
  END as admin_status
FROM public.user_profiles
ORDER BY created_at;

-- 2. Verificar se a função is_current_user_admin existe
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'is_current_user_admin' 
  AND routine_schema = 'public';

-- 3. Testar a função is_current_user_admin para cada usuário
DO $$
DECLARE
  user_record RECORD;
  is_admin_result BOOLEAN;
BEGIN
  RAISE NOTICE 'Testando função is_current_user_admin para todos os usuários:';
  
  FOR user_record IN 
    SELECT id, name, role FROM public.user_profiles
  LOOP
    -- Simular auth.uid() retornando o ID do usuário
    PERFORM set_config('request.jwt.claims', json_build_object('sub', user_record.id)::text, true);
    
    -- Testar a função
    SELECT public.is_current_user_admin() INTO is_admin_result;
    
    RAISE NOTICE 'Usuário: % (%) - Role: % - is_current_user_admin(): %', 
      user_record.name, 
      user_record.id, 
      user_record.role, 
      COALESCE(is_admin_result::text, 'NULL');
  END LOOP;
END $$;

-- 4. Verificar se existe pelo menos um usuário admin ativo
SELECT 
  COUNT(*) as total_admins,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count
FROM public.user_profiles;

-- 5. Se não houver admin, criar um usuário admin de teste
DO $$
DECLARE
  admin_count INTEGER;
  first_user_id UUID;
BEGIN
  -- Contar admins
  SELECT COUNT(*) INTO admin_count
  FROM public.user_profiles
  WHERE role = 'admin';
  
  RAISE NOTICE 'Número de usuários admin encontrados: %', admin_count;
  
  -- Se não há admin, promover o primeiro usuário
  IF admin_count = 0 THEN
    SELECT id INTO first_user_id
    FROM public.user_profiles
    ORDER BY created_at
    LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
      UPDATE public.user_profiles
      SET role = 'admin'
      WHERE id = first_user_id;
      
      RAISE NOTICE 'Usuário % promovido para admin', first_user_id;
    ELSE
      RAISE NOTICE 'Nenhum usuário encontrado para promover';
    END IF;
  END IF;
END $$;

-- 6. Verificar novamente após possível promoção
SELECT 
  id,
  name,
  role,
  'ADMIN VERIFICADO' as status
FROM public.user_profiles
WHERE role = 'admin';