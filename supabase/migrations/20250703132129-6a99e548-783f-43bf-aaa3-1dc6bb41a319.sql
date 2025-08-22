-- FASE 1: Corrigir dependências e remover tabelas redundantes

-- Primeiro, corrigir políticas RLS que usam a função is_admin() obsoleta
-- Substituir por is_user_admin() que já existe e está funcionando

-- 1. Atualizar políticas em user_profiles
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

CREATE POLICY "Admins can update any profile" ON public.user_profiles
  FOR UPDATE USING (is_user_admin());

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (is_user_admin());

-- 2. Atualizar políticas em defect_types
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios tipos de defeitos" ON public.defect_types;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios tipos de defeitos" ON public.defect_types;
DROP POLICY IF EXISTS "Usuários podem inserir tipos de defeitos" ON public.defect_types;

CREATE POLICY "Usuários podem atualizar seus próprios tipos de defeitos" ON public.defect_types
  FOR UPDATE USING ((user_id = auth.uid()) OR (user_id IS NULL) OR is_user_admin());

CREATE POLICY "Usuários podem deletar seus próprios tipos de defeitos" ON public.defect_types
  FOR DELETE USING ((user_id = auth.uid()) OR (user_id IS NULL) OR is_user_admin());

CREATE POLICY "Usuários podem inserir tipos de defeitos" ON public.defect_types
  FOR INSERT WITH CHECK ((user_id = auth.uid()) OR is_user_admin());

-- 3. Atualizar políticas em brands
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias marcas" ON public.brands;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias marcas" ON public.brands;
DROP POLICY IF EXISTS "Usuários podem inserir marcas" ON public.brands;

CREATE POLICY "Usuários podem atualizar suas próprias marcas" ON public.brands
  FOR UPDATE USING ((user_id = auth.uid()) OR (user_id IS NULL) OR is_user_admin());

CREATE POLICY "Usuários podem deletar suas próprias marcas" ON public.brands
  FOR DELETE USING ((user_id = auth.uid()) OR (user_id IS NULL) OR is_user_admin());

CREATE POLICY "Usuários podem inserir marcas" ON public.brands
  FOR INSERT WITH CHECK ((user_id = auth.uid()) OR is_user_admin());