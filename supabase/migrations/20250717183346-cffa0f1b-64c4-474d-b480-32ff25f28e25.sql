-- Adicionar configuração para funcionalidade em desenvolvimento
ALTER TABLE public.site_settings 
ADD COLUMN show_dev_warning BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN dev_warning_title TEXT DEFAULT 'Funcionalidade em Desenvolvimento',
ADD COLUMN dev_warning_message TEXT DEFAULT 'Esta funcionalidade ainda está em desenvolvimento. Em breve estará disponível com melhorias completas.';