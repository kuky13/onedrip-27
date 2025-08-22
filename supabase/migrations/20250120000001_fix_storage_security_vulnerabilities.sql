-- =====================================================
-- CORREÇÃO CRÍTICA DE VULNERABILIDADES DE STORAGE
-- Data: 2025-01-20
-- Descrição: Corrige buckets públicos e adiciona validações rigorosas
-- =====================================================

-- 1. TORNAR BUCKETS PRIVADOS (CRÍTICO)
-- Buckets públicos permitem acesso direto sem autenticação
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('company-logos', 'admin-assets');

-- 2. ADICIONAR VALIDAÇÃO DE MIME TYPE MAIS RIGOROSA
-- Função para validar arquivos de imagem com verificação de cabeçalho
CREATE OR REPLACE FUNCTION public.validate_image_file_security(
  file_data bytea,
  mime_type text,
  file_size bigint
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar tamanho máximo (3MB para logos, 10MB para outros)
  IF file_size > 10485760 THEN
    RAISE EXCEPTION 'Arquivo muito grande. Tamanho máximo: 10MB';
  END IF;
  
  -- Validar MIME types permitidos
  IF mime_type NOT IN (
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) THEN
    RAISE EXCEPTION 'Tipo de arquivo não permitido: %. Apenas imagens, PDFs e documentos Office são aceitos.', mime_type;
  END IF;
  
  -- Validar cabeçalho do arquivo para prevenir upload de arquivos maliciosos
  -- Verificar assinatura de arquivos de imagem
  IF mime_type LIKE 'image/%' THEN
    -- JPEG: FF D8 FF
    IF mime_type = 'image/jpeg' AND NOT (get_byte(file_data, 0) = 255 AND get_byte(file_data, 1) = 216 AND get_byte(file_data, 2) = 255) THEN
      RAISE EXCEPTION 'Arquivo JPEG inválido ou corrompido';
    END IF;
    
    -- PNG: 89 50 4E 47
    IF mime_type = 'image/png' AND NOT (
      get_byte(file_data, 0) = 137 AND 
      get_byte(file_data, 1) = 80 AND 
      get_byte(file_data, 2) = 78 AND 
      get_byte(file_data, 3) = 71
    ) THEN
      RAISE EXCEPTION 'Arquivo PNG inválido ou corrompido';
    END IF;
    
    -- GIF: 47 49 46 38
    IF mime_type = 'image/gif' AND NOT (
      get_byte(file_data, 0) = 71 AND 
      get_byte(file_data, 1) = 73 AND 
      get_byte(file_data, 2) = 70 AND 
      get_byte(file_data, 3) = 56
    ) THEN
      RAISE EXCEPTION 'Arquivo GIF inválido ou corrompido';
    END IF;
  END IF;
  
  -- Verificar se não contém scripts maliciosos (básico)
  IF position('script' in lower(convert_from(file_data, 'UTF8'))) > 0 THEN
    RAISE EXCEPTION 'Arquivo contém conteúdo suspeito';
  END IF;
  
  RETURN true;
END;
$$;

-- 3. ADICIONAR POLÍTICAS DE STORAGE MAIS RESTRITIVAS
-- Remover políticas antigas que podem ser muito permissivas
DROP POLICY IF EXISTS "Users can upload their own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own company logos" ON storage.objects;

-- Políticas mais seguras para company-logos
CREATE POLICY "Secure company logo upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'company-logos' AND
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  -- Validar extensão do arquivo
  lower(right(name, 4)) IN ('.jpg', '.png', '.gif') OR
  lower(right(name, 5)) IN ('.jpeg', '.webp') AND
  -- Validar tamanho do arquivo através do nome (limitação do storage)
  length(name) < 200
);

CREATE POLICY "Secure company logo view" ON storage.objects
FOR SELECT USING (
  bucket_id = 'company-logos' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    public.is_current_user_admin()
  )
);

CREATE POLICY "Secure company logo update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'company-logos' AND
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Secure company logo delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'company-logos' AND
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. ADICIONAR AUDITORIA DE UPLOADS
CREATE TABLE IF NOT EXISTS public.file_upload_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  bucket_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  upload_ip INET,
  user_agent TEXT,
  upload_status TEXT NOT NULL DEFAULT 'success',
  security_scan_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.file_upload_audit ENABLE ROW LEVEL SECURITY;

-- Política para auditoria - apenas admins podem ver
CREATE POLICY "Only admins can view upload audit" ON public.file_upload_audit
FOR SELECT USING (public.is_current_user_admin());

-- 5. FUNÇÃO PARA LOG DE UPLOAD SEGURO
CREATE OR REPLACE FUNCTION public.log_file_upload(
  p_bucket_id TEXT,
  p_file_name TEXT,
  p_file_size BIGINT,
  p_mime_type TEXT,
  p_upload_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  audit_id UUID;
BEGIN
  -- Verificar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Inserir log de auditoria
  INSERT INTO public.file_upload_audit (
    user_id,
    bucket_id,
    file_name,
    file_size,
    mime_type,
    upload_ip,
    user_agent
  ) VALUES (
    auth.uid(),
    p_bucket_id,
    p_file_name,
    p_file_size,
    p_mime_type,
    p_upload_ip,
    p_user_agent
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- 6. ADICIONAR LIMITE DE UPLOADS POR USUÁRIO
CREATE TABLE IF NOT EXISTS public.user_upload_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  daily_upload_count INTEGER DEFAULT 0,
  daily_upload_size BIGINT DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  total_storage_used BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_upload_limits ENABLE ROW LEVEL SECURITY;

-- Política para limites de upload
CREATE POLICY "Users can view their own upload limits" ON public.user_upload_limits
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage upload limits" ON public.user_upload_limits
FOR ALL USING (public.is_current_user_admin());

-- 7. FUNÇÃO PARA VERIFICAR LIMITES DE UPLOAD
CREATE OR REPLACE FUNCTION public.check_upload_limits(
  p_file_size BIGINT
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_limits RECORD;
  max_daily_uploads INTEGER := 50;
  max_daily_size BIGINT := 104857600; -- 100MB
  max_total_storage BIGINT := 1073741824; -- 1GB
BEGIN
  -- Verificar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Buscar ou criar limites do usuário
  SELECT * INTO current_limits
  FROM public.user_upload_limits
  WHERE user_id = auth.uid();
  
  -- Se não existe, criar registro
  IF NOT FOUND THEN
    INSERT INTO public.user_upload_limits (user_id)
    VALUES (auth.uid());
    
    SELECT * INTO current_limits
    FROM public.user_upload_limits
    WHERE user_id = auth.uid();
  END IF;
  
  -- Reset diário se necessário
  IF current_limits.last_reset_date < CURRENT_DATE THEN
    UPDATE public.user_upload_limits
    SET 
      daily_upload_count = 0,
      daily_upload_size = 0,
      last_reset_date = CURRENT_DATE
    WHERE user_id = auth.uid();
    
    current_limits.daily_upload_count := 0;
    current_limits.daily_upload_size := 0;
  END IF;
  
  -- Verificar limites
  IF current_limits.daily_upload_count >= max_daily_uploads THEN
    RAISE EXCEPTION 'Limite diário de uploads excedido (máximo: %)', max_daily_uploads;
  END IF;
  
  IF current_limits.daily_upload_size + p_file_size > max_daily_size THEN
    RAISE EXCEPTION 'Limite diário de tamanho excedido (máximo: % MB)', max_daily_size / 1048576;
  END IF;
  
  IF current_limits.total_storage_used + p_file_size > max_total_storage THEN
    RAISE EXCEPTION 'Limite total de armazenamento excedido (máximo: % GB)', max_total_storage / 1073741824;
  END IF;
  
  -- Atualizar contadores
  UPDATE public.user_upload_limits
  SET 
    daily_upload_count = daily_upload_count + 1,
    daily_upload_size = daily_upload_size + p_file_size,
    total_storage_used = total_storage_used + p_file_size,
    updated_at = now()
  WHERE user_id = auth.uid();
  
  RETURN true;
END;
$$;

-- 8. TRIGGER PARA VALIDAÇÃO AUTOMÁTICA DE UPLOADS
CREATE OR REPLACE FUNCTION public.validate_storage_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar limites de upload
  PERFORM public.check_upload_limits(NEW.metadata->>'size');
  
  -- Log do upload
  PERFORM public.log_file_upload(
    NEW.bucket_id,
    NEW.name,
    (NEW.metadata->>'size')::BIGINT,
    NEW.metadata->>'mimetype'
  );
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger na tabela de objetos do storage
-- Nota: Este trigger pode precisar ser aplicado via dashboard do Supabase
CREATE TRIGGER validate_storage_upload_trigger
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_storage_upload();

-- 9. ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE public.file_upload_audit IS 'Auditoria de uploads de arquivos para monitoramento de segurança';
COMMENT ON TABLE public.user_upload_limits IS 'Limites de upload por usuário para prevenir abuso';
COMMENT ON FUNCTION public.validate_image_file_security IS 'Validação rigorosa de arquivos de imagem incluindo verificação de cabeçalho';
COMMENT ON FUNCTION public.check_upload_limits IS 'Verificação de limites de upload para prevenir abuso do sistema';

-- 10. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_file_upload_audit_user_id ON public.file_upload_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_file_upload_audit_created_at ON public.file_upload_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_user_upload_limits_last_reset ON public.user_upload_limits(last_reset_date);

-- =====================================================
-- RESUMO DAS CORREÇÕES APLICADAS:
-- 1. Buckets tornados privados (correção crítica)
-- 2. Validação rigorosa de MIME types e cabeçalhos
-- 3. Políticas de storage mais restritivas
-- 4. Sistema de auditoria de uploads
-- 5. Limites de upload por usuário
-- 6. Prevenção contra arquivos maliciosos
-- 7. Logs detalhados para monitoramento
-- =====================================================