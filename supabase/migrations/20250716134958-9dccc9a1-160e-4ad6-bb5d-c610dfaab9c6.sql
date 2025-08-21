-- Corrigir políticas RLS para exclusão de orçamentos
-- O problema está nas políticas que requerem autenticação mas a sessão pode não estar sendo propagada corretamente

-- 1. Primeiro, vamos verificar e corrigir a função soft_delete_budget_with_audit
DROP FUNCTION IF EXISTS public.soft_delete_budget_with_audit(uuid, text);

CREATE OR REPLACE FUNCTION public.soft_delete_budget_with_audit(p_budget_id uuid, p_deletion_reason text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  budget_data JSONB;
  parts_data JSONB;
  budget_owner_id UUID;
BEGIN
  -- Obter o ID do usuário atual
  current_user_id := auth.uid();
  
  -- Log para debug
  RAISE NOTICE 'User ID: %, Budget ID: %', current_user_id, p_budget_id;
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado. Faça login novamente.');
  END IF;

  -- Verificar se o orçamento existe e obter dados
  SELECT to_jsonb(b.*), b.owner_id INTO budget_data, budget_owner_id
  FROM public.budgets b
  WHERE b.id = p_budget_id 
    AND b.deleted_at IS NULL;

  IF budget_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Orçamento não encontrado ou já foi excluído');
  END IF;

  -- Verificar se o usuário é o proprietário ou admin
  IF budget_owner_id != current_user_id AND NOT public.is_current_user_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você só pode excluir seus próprios orçamentos');
  END IF;

  -- Obter dados das partes
  SELECT COALESCE(jsonb_agg(to_jsonb(bp.*)), '[]'::jsonb) INTO parts_data
  FROM public.budget_parts bp
  WHERE bp.budget_id = p_budget_id AND bp.deleted_at IS NULL;

  BEGIN
    -- Soft delete das partes
    UPDATE public.budget_parts
    SET deleted_at = now(), deleted_by = current_user_id
    WHERE budget_id = p_budget_id AND deleted_at IS NULL;

    -- Soft delete do orçamento
    UPDATE public.budgets
    SET deleted_at = now(), deleted_by = current_user_id
    WHERE id = p_budget_id AND deleted_at IS NULL;

    -- Registrar na auditoria
    INSERT INTO public.budget_deletion_audit (
      budget_id, budget_data, parts_data, deleted_by, 
      deletion_type, deletion_reason
    ) VALUES (
      p_budget_id, budget_data, parts_data, 
      current_user_id, 'single', COALESCE(p_deletion_reason, 'Exclusão via interface')
    );

    RETURN jsonb_build_object(
      'success', true, 
      'budget_id', p_budget_id,
      'deleted_at', now()
    );
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'error', 'Erro interno: ' || SQLERRM);
  END;
END;
$$;

-- 2. Melhorar a função de verificação de admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  user_active BOOLEAN;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Se não há usuário autenticado, não é admin
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Buscar role e status ativo do usuário
  SELECT role, is_active 
  INTO user_role, user_active
  FROM public.user_profiles 
  WHERE id = current_user_id;
  
  -- Retornar true apenas se for admin ativo
  RETURN (user_role = 'admin' AND user_active = TRUE);
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- 3. Criar função de debug para verificar contexto do usuário
CREATE OR REPLACE FUNCTION public.debug_user_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  user_data JSONB;
BEGIN
  current_user_id := auth.uid();
  
  SELECT jsonb_build_object(
    'auth_uid', current_user_id,
    'profile_exists', EXISTS(SELECT 1 FROM public.user_profiles WHERE id = current_user_id),
    'profile_data', (SELECT to_jsonb(up.*) FROM public.user_profiles up WHERE id = current_user_id),
    'budget_count', (SELECT COUNT(*) FROM public.budgets WHERE owner_id = current_user_id AND deleted_at IS NULL),
    'timestamp', now()
  ) INTO user_data;
  
  RETURN user_data;
END;
$$;