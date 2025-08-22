-- FASE 1B: REMOVER POLÍTICAS DUPLICADAS
-- =====================================

-- Remover políticas duplicadas da tabela user_profiles
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;

-- Remover políticas duplicadas da tabela shop_profiles
DROP POLICY IF EXISTS "Users can create their own shop profile" ON public.shop_profiles;
DROP POLICY IF EXISTS "Users can delete their own shop profile" ON public.shop_profiles;
DROP POLICY IF EXISTS "Users can insert their own shop profile" ON public.shop_profiles;
DROP POLICY IF EXISTS "Users can update their own shop profile" ON public.shop_profiles;
DROP POLICY IF EXISTS "Users can view their own shop profile" ON public.shop_profiles;