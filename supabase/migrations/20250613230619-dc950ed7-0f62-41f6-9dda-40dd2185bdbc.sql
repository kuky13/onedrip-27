
-- Criar bucket para logos das empresas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  3145728, -- 3MB em bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Política para permitir que usuários façam upload de suas próprias logos
CREATE POLICY "Users can upload their own company logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir que usuários vejam suas próprias logos
CREATE POLICY "Users can view their own company logos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'company-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir que usuários atualizem suas próprias logos
CREATE POLICY "Users can update their own company logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir que usuários deletem suas próprias logos
CREATE POLICY "Users can delete their own company logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
