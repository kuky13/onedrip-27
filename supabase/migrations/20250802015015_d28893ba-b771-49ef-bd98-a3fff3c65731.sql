-- Atualizar função generate_license_code para gerar códigos de 13 caracteres
CREATE OR REPLACE FUNCTION public.generate_license_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  -- Gerar código aleatório de 13 caracteres
  FOR i IN 1..13 LOOP
    code := code || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  
  -- Verificar se já existe e gerar novo se necessário
  WHILE EXISTS (SELECT 1 FROM public.licenses WHERE code = code) LOOP
    code := '';
    FOR i IN 1..13 LOOP
      code := code || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  RETURN code;
END;
$$;