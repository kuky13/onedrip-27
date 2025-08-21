-- =====================================================
-- IMPLEMENTAÇÃO SEGURA DO BUCKET SERVICE-ORDERS
-- Data: 2025-01-25
-- Descrição: Implementa bucket para anexos de ordens de serviço com RLS
-- =====================================================

-- 1. CRIAR BUCKET PARA ANEXOS DE ORDENS DE SERVIÇO
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-orders',
  'service-orders',
  false, -- PRIVADO - acesso apenas com autenticação
  10485760, -- 10MB máximo por arquivo
  ARRAY[
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
) ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS RLS PARA BUCKET SERVICE-ORDERS

-- Política para UPLOAD de anexos
-- Usuários podem fazer upload apenas para suas próprias ordens de serviço
CREATE POLICY "Users can upload service order attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'service-orders' AND
  auth.uid() IS NOT NULL AND
  -- Verificar se a ordem de serviço pertence ao usuário
  EXISTS (
    SELECT 1 FROM service_orders 
    WHERE id::text = (storage.foldername(name))[1] 
    AND owner_id = auth.uid()
    AND deleted_at IS NULL
  ) AND
  -- Validar extensão do arquivo
  (
    lower(right(name, 4)) IN ('.jpg', '.png', '.gif', '.pdf', '.txt', '.doc') OR
    lower(right(name, 5)) IN ('.jpeg', '.webp', '.docx', '.xlsx')
  ) AND
  -- Validar tamanho do nome do arquivo
  length(name) < 300
);

-- Política para VISUALIZAÇÃO de anexos
-- Usuários podem ver anexos de suas próprias ordens de serviço
CREATE POLICY "Users can view service order attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'service-orders' AND
  (
    -- Proprietário da ordem de serviço
    EXISTS (
      SELECT 1 FROM service_orders 
      WHERE id::text = (storage.foldername(name))[1] 
      AND owner_id = auth.uid()
      AND deleted_at IS NULL
    ) OR
    -- Administradores podem ver todos os anexos
    public.is_current_user_admin()
  )
);

-- Política para ATUALIZAÇÃO de anexos
-- Usuários podem atualizar anexos de suas próprias ordens de serviço
CREATE POLICY "Users can update service order attachments" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'service-orders' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM service_orders 
    WHERE id::text = (storage.foldername(name))[1] 
    AND owner_id = auth.uid()
    AND deleted_at IS NULL
  )
);

-- Política para EXCLUSÃO de anexos
-- Usuários podem deletar anexos de suas próprias ordens de serviço
CREATE POLICY "Users can delete service order attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'service-orders' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM service_orders 
    WHERE id::text = (storage.foldername(name))[1] 
    AND owner_id = auth.uid()
    AND deleted_at IS NULL
  )
);

-- 3. FUNÇÃO PARA VALIDAR UPLOAD DE ANEXOS
CREATE OR REPLACE FUNCTION public.validate_service_order_attachment_upload(
  p_service_order_id UUID,
  p_file_name TEXT,
  p_file_size BIGINT,
  p_mime_type TEXT
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se a ordem de serviço existe e pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM service_orders 
    WHERE id = p_service_order_id 
    AND owner_id = auth.uid()
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Ordem de serviço não encontrada ou acesso negado';
  END IF;
  
  -- Verificar limite de arquivos por ordem de serviço (máximo 10)
  IF (
    SELECT COUNT(*) 
    FROM service_order_attachments 
    WHERE service_order_id = p_service_order_id
  ) >= 10 THEN
    RAISE EXCEPTION 'Limite máximo de 10 anexos por ordem de serviço atingido';
  END IF;
  
  -- Verificar tamanho total de anexos por ordem de serviço (máximo 50MB)
  IF (
    SELECT COALESCE(SUM(file_size), 0) 
    FROM service_order_attachments 
    WHERE service_order_id = p_service_order_id
  ) + p_file_size > 52428800 THEN -- 50MB
    RAISE EXCEPTION 'Limite total de 50MB de anexos por ordem de serviço excedido';
  END IF;
  
  -- Validar MIME type
  IF p_mime_type NOT IN (
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) THEN
    RAISE EXCEPTION 'Tipo de arquivo não permitido: %. Apenas imagens, PDFs e documentos Office são aceitos.', p_mime_type;
  END IF;
  
  -- Validar tamanho do arquivo (máximo 10MB)
  IF p_file_size > 10485760 THEN
    RAISE EXCEPTION 'Arquivo muito grande. Tamanho máximo: 10MB';
  END IF;
  
  -- Log da validação
  PERFORM public.log_file_upload(
    'service-orders',
    p_file_name,
    p_file_size,
    p_mime_type
  );
  
  RETURN true;
END;
$$;

-- 4. TRIGGER PARA AUDITORIA DE ANEXOS
CREATE OR REPLACE FUNCTION public.audit_service_order_attachment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log de inserção de anexo
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_logs (
      user_id,
      action,
      table_name,
      record_id,
      details
    ) VALUES (
      auth.uid(),
      'attachment_uploaded',
      'service_order_attachments',
      NEW.id,
      jsonb_build_object(
        'service_order_id', NEW.service_order_id,
        'file_name', NEW.file_name,
        'file_size', NEW.file_size,
        'mime_type', NEW.mime_type
      )
    );
    RETURN NEW;
  END IF;
  
  -- Log de exclusão de anexo
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.admin_logs (
      user_id,
      action,
      table_name,
      record_id,
      details
    ) VALUES (
      auth.uid(),
      'attachment_deleted',
      'service_order_attachments',
      OLD.id,
      jsonb_build_object(
        'service_order_id', OLD.service_order_id,
        'file_name', OLD.file_name,
        'file_size', OLD.file_size
      )
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Aplicar trigger na tabela de anexos
CREATE TRIGGER audit_service_order_attachment_trigger
  AFTER INSERT OR DELETE ON public.service_order_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_service_order_attachment();

-- 5. ATIVAR TRIGGER DE VALIDAÇÃO DE STORAGE
-- Este trigger valida uploads automaticamente
CREATE TRIGGER validate_storage_upload_trigger
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_storage_upload();

-- 6. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMENT ON FUNCTION public.validate_service_order_attachment_upload IS 'Validação rigorosa de uploads de anexos para ordens de serviço';
COMENT ON FUNCTION public.audit_service_order_attachment IS 'Auditoria de operações em anexos de ordens de serviço';

-- 7. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_service_order_attachments_service_order_id 
ON public.service_order_attachments(service_order_id);

CREATE INDEX IF NOT EXISTS idx_service_order_attachments_uploaded_by 
ON public.service_order_attachments(uploaded_by);

-- =====================================================
-- RESUMO DA IMPLEMENTAÇÃO:
-- 1. Bucket service-orders criado como PRIVADO
-- 2. Políticas RLS restritivas implementadas
-- 3. Validação rigorosa de uploads
-- 4. Limites por ordem de serviço (10 arquivos, 50MB total)
-- 5. Auditoria completa de operações
-- 6. Trigger de validação ativado
-- 7. Índices para performance
-- =====================================================

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Bucket service-orders implementado com sucesso!';
    RAISE NOTICE 'Políticas RLS aplicadas para máxima segurança.';
    RAISE NOTICE 'Sistema de auditoria ativo para todos os uploads.';
END $$;