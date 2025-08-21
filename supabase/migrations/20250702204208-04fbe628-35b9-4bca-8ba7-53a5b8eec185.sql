
-- 1. Adicionar colunas para soft delete nas tabelas principais
ALTER TABLE public.budgets 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

ALTER TABLE public.budget_parts 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- 2. Criar tabela de auditoria para exclusões
CREATE TABLE public.budget_deletion_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL,
  budget_data JSONB NOT NULL,
  parts_data JSONB DEFAULT '[]'::jsonb,
  deleted_by UUID REFERENCES auth.users(id) NOT NULL,
  deletion_type TEXT NOT NULL CHECK (deletion_type IN ('single', 'mass', 'batch')),
  deletion_reason TEXT,
  can_restore BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Limpar políticas RLS conflitantes e criar novas mais específicas
-- Remover políticas conflitantes da tabela budgets
DROP POLICY IF EXISTS "Acesso público para orçamentos" ON public.budgets;
DROP POLICY IF EXISTS "Admins can manage all budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;

-- Criar políticas RLS mais específicas e seguras para budgets
CREATE POLICY "Users can view own active budgets" ON public.budgets
  FOR SELECT USING (owner_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can insert own budgets" ON public.budgets
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own active budgets" ON public.budgets
  FOR UPDATE USING (owner_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can soft delete own budgets" ON public.budgets
  FOR UPDATE USING (owner_id = auth.uid() AND deleted_at IS NULL);

-- Admins podem ver todos os orçamentos (incluindo excluídos)
CREATE POLICY "Admins can view all budgets" ON public.budgets
  FOR SELECT USING (check_if_user_is_admin(auth.uid()));

CREATE POLICY "Admins can manage all budgets" ON public.budgets
  FOR ALL USING (check_if_user_is_admin(auth.uid()));

-- Remover políticas conflitantes da tabela budget_parts
DROP POLICY IF EXISTS "Acesso público para peças" ON public.budget_parts;

-- Criar políticas RLS para budget_parts
CREATE POLICY "Users can view parts of own active budgets" ON public.budget_parts
  FOR SELECT USING (
    budget_id IN (
      SELECT id FROM public.budgets 
      WHERE owner_id = auth.uid() AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  );

CREATE POLICY "Users can manage parts of own active budgets" ON public.budget_parts
  FOR ALL USING (
    budget_id IN (
      SELECT id FROM public.budgets 
      WHERE owner_id = auth.uid() AND deleted_at IS NULL
    )
  );

CREATE POLICY "Admins can view all budget parts" ON public.budget_parts
  FOR SELECT USING (check_if_user_is_admin(auth.uid()));

CREATE POLICY "Admins can manage all budget parts" ON public.budget_parts
  FOR ALL USING (check_if_user_is_admin(auth.uid()));

-- 4. Habilitar RLS na tabela de auditoria
ALTER TABLE public.budget_deletion_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion audit" ON public.budget_deletion_audit
  FOR SELECT USING (deleted_by = auth.uid());

CREATE POLICY "Admins can view all deletion audit" ON public.budget_deletion_audit
  FOR SELECT USING (check_if_user_is_admin(auth.uid()));

CREATE POLICY "Only system can insert audit records" ON public.budget_deletion_audit
  FOR INSERT WITH CHECK (deleted_by = auth.uid());

-- 5. Criar função melhorada para soft delete de orçamentos
CREATE OR REPLACE FUNCTION public.soft_delete_budget_with_audit(
  p_budget_id UUID,
  p_deletion_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  budget_data JSONB;
  parts_data JSONB;
  result JSONB;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se o orçamento existe e não foi excluído
  SELECT to_jsonb(b.*) INTO budget_data
  FROM public.budgets b
  WHERE b.id = p_budget_id 
    AND b.owner_id = current_user_id 
    AND b.deleted_at IS NULL;

  IF budget_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Orçamento não encontrado ou já excluído');
  END IF;

  -- Obter dados das partes
  SELECT jsonb_agg(to_jsonb(bp.*)) INTO parts_data
  FROM public.budget_parts bp
  WHERE bp.budget_id = p_budget_id AND bp.deleted_at IS NULL;

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
    p_budget_id, budget_data, COALESCE(parts_data, '[]'::jsonb), 
    current_user_id, 'single', p_deletion_reason
  );

  RETURN jsonb_build_object(
    'success', true, 
    'budget_id', p_budget_id,
    'deleted_at', now()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 6. Função para exclusão em massa com auditoria
CREATE OR REPLACE FUNCTION public.soft_delete_all_user_budgets(
  p_deletion_reason TEXT DEFAULT 'Exclusão em massa pelo usuário'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  budget_record RECORD;
  deleted_count INTEGER := 0;
  audit_records JSONB := '[]'::jsonb;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Processar cada orçamento ativo do usuário
  FOR budget_record IN 
    SELECT b.id, to_jsonb(b.*) as budget_data,
           COALESCE(
             (SELECT jsonb_agg(to_jsonb(bp.*)) 
              FROM public.budget_parts bp 
              WHERE bp.budget_id = b.id AND bp.deleted_at IS NULL), 
             '[]'::jsonb
           ) as parts_data
    FROM public.budgets b
    WHERE b.owner_id = current_user_id AND b.deleted_at IS NULL
  LOOP
    -- Soft delete das partes
    UPDATE public.budget_parts
    SET deleted_at = now(), deleted_by = current_user_id
    WHERE budget_id = budget_record.id AND deleted_at IS NULL;

    -- Soft delete do orçamento
    UPDATE public.budgets
    SET deleted_at = now(), deleted_by = current_user_id
    WHERE id = budget_record.id;

    -- Registrar na auditoria
    INSERT INTO public.budget_deletion_audit (
      budget_id, budget_data, parts_data, deleted_by, 
      deletion_type, deletion_reason
    ) VALUES (
      budget_record.id, budget_record.budget_data, budget_record.parts_data,
      current_user_id, 'mass', p_deletion_reason
    );

    deleted_count := deleted_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'deleted_at', now()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 7. Função para restaurar orçamento excluído
CREATE OR REPLACE FUNCTION public.restore_deleted_budget(p_budget_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  budget_owner UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se o orçamento foi excluído pelo usuário atual
  SELECT owner_id INTO budget_owner
  FROM public.budgets
  WHERE id = p_budget_id 
    AND deleted_by = current_user_id 
    AND deleted_at IS NOT NULL;

  IF budget_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Orçamento não encontrado ou não pode ser restaurado');
  END IF;

  -- Restaurar orçamento
  UPDATE public.budgets
  SET deleted_at = NULL, deleted_by = NULL
  WHERE id = p_budget_id;

  -- Restaurar partes
  UPDATE public.budget_parts
  SET deleted_at = NULL, deleted_by = NULL
  WHERE budget_id = p_budget_id AND deleted_by = current_user_id;

  -- Marcar como não restaurável na auditoria
  UPDATE public.budget_deletion_audit
  SET can_restore = false
  WHERE budget_id = p_budget_id AND deleted_by = current_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'budget_id', p_budget_id,
    'restored_at', now()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_budgets_deleted_at ON public.budgets(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_budget_parts_deleted_at ON public.budget_parts(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_budget_deletion_audit_deleted_by ON public.budget_deletion_audit(deleted_by);
CREATE INDEX IF NOT EXISTS idx_budget_deletion_audit_created_at ON public.budget_deletion_audit(created_at);

-- 9. Função para limpeza automática de registros antigos (executar mensalmente)
CREATE OR REPLACE FUNCTION public.cleanup_old_deleted_budgets()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Deletar permanentemente orçamentos excluídos há mais de 90 dias
  WITH deleted_budgets AS (
    DELETE FROM public.budgets 
    WHERE deleted_at < (now() - INTERVAL '90 days')
    RETURNING id
  )
  SELECT COUNT(*) INTO cleanup_count FROM deleted_budgets;

  -- Marcar registros de auditoria como não restauráveis
  UPDATE public.budget_deletion_audit
  SET can_restore = false
  WHERE created_at < (now() - INTERVAL '90 days') AND can_restore = true;

  RETURN cleanup_count;
END;
$$;
