-- Limpar registros duplicados da tabela site_settings, mantendo apenas o mais recente
DELETE FROM public.site_settings 
WHERE id NOT IN (
  SELECT id 
  FROM public.site_settings 
  ORDER BY created_at DESC 
  LIMIT 1
);