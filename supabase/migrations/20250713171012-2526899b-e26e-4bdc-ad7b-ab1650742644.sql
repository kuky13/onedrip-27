-- CORREÇÃO DE SEGURANÇA - PROJETO OLIVEIRA
-- Etapa 1: Remoção das políticas conflitantes por tabela

-- =====================================================
-- 1. REMOÇÃO SISTEMÁTICA DE POLÍTICAS CONFLITANTES
-- =====================================================

-- Remover todas as políticas que usam funções inconsistentes
-- TABELA: brands
DROP POLICY IF EXISTS "Only admins can modify brands" ON public.brands;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias marcas" ON public.brands;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias marcas" ON public.brands;
DROP POLICY IF EXISTS "Usuários podem inserir marcas" ON public.brands;

-- TABELA: defect_types  
DROP POLICY IF EXISTS "Only admins can modify defect types" ON public.defect_types;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios tipos de defeitos" ON public.defect_types;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios tipos de defeitos" ON public.defect_types;
DROP POLICY IF EXISTS "Usuários podem inserir tipos de defeitos" ON public.defect_types;

-- TABELA: device_types
DROP POLICY IF EXISTS "Only admins can modify device types" ON public.device_types;

-- TABELA: payment_conditions
DROP POLICY IF EXISTS "Only admins can modify payment conditions" ON public.payment_conditions;

-- TABELA: warranty_periods
DROP POLICY IF EXISTS "Only admins can modify warranty periods" ON public.warranty_periods;

-- Agora podemos remover as funções conflitantes
DROP FUNCTION IF EXISTS public.is_user_admin();
DROP FUNCTION IF EXISTS public.check_if_user_is_admin(uuid);

-- =====================================================
-- 2. CRIAÇÃO DE FUNÇÕES PADRONIZADAS
-- =====================================================

-- Função alias para compatibilidade
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.is_current_user_admin();
$$;

-- Função para verificar se outro usuário é admin (para uso por admins)
CREATE OR REPLACE FUNCTION public.is_user_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = target_user_id AND role = 'admin' AND is_active = true
  );
$$;