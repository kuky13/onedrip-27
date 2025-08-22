
-- Adicionar coluna CNPJ à tabela shop_profiles
ALTER TABLE public.shop_profiles 
ADD COLUMN IF NOT EXISTS cnpj TEXT;

-- Habilitar RLS na tabela shop_profiles se ainda não estiver habilitado
ALTER TABLE public.shop_profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view their own shop profile" ON public.shop_profiles;
DROP POLICY IF EXISTS "Users can insert their own shop profile" ON public.shop_profiles;
DROP POLICY IF EXISTS "Users can update their own shop profile" ON public.shop_profiles;
DROP POLICY IF EXISTS "Users can delete their own shop profile" ON public.shop_profiles;

-- Criar políticas RLS para shop_profiles
CREATE POLICY "Users can view their own shop profile" ON public.shop_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own shop profile" ON public.shop_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own shop profile" ON public.shop_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own shop profile" ON public.shop_profiles
  FOR DELETE USING (user_id = auth.uid());

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_shop_profiles_user_id ON public.shop_profiles(user_id);
