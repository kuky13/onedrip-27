-- Corrigir função is_current_user_admin removendo referência à coluna is_active

-- 1. Primeiro, verificar se a coluna is_active existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'is_active' 
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE 'Coluna is_active existe na tabela user_profiles';
  ELSE
    RAISE NOTICE 'Coluna is_active NÃO existe na tabela user_profiles';
  END IF;
END $$;

-- 2. Recriar a função is_current_user_admin sem a coluna is_active
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. Verificar usuários existentes
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

-- 4. Verificar se existe pelo menos um usuário admin
DO $$
DECLARE
  admin_count INTEGER;
  first_user_id UUID;
  first_user_name TEXT;
BEGIN
  -- Contar admins
  SELECT COUNT(*) INTO admin_count
  FROM public.user_profiles
  WHERE role = 'admin';
  
  RAISE NOTICE 'Número de usuários admin encontrados: %', admin_count;
  
  -- Se não há admin, promover o primeiro usuário
  IF admin_count = 0 THEN
    SELECT id, name INTO first_user_id, first_user_name
    FROM public.user_profiles
    ORDER BY created_at
    LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
      UPDATE public.user_profiles
      SET role = 'admin'
      WHERE id = first_user_id;
      
      RAISE NOTICE 'Usuário % (%) promovido para admin', first_user_name, first_user_id;
    ELSE
      RAISE NOTICE 'Nenhum usuário encontrado para promover';
    END IF;
  END IF;
END $$;

-- 5. Verificar resultado final
SELECT 
  id,
  name,
  role,
  'ADMIN CONFIRMADO' as status
FROM public.user_profiles
WHERE role = 'admin';