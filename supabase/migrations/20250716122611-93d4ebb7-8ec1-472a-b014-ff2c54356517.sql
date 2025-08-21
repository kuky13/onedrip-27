-- Atualizar a tabela user_profiles para ter advanced_features_enabled = true por padrão
ALTER TABLE public.user_profiles ALTER COLUMN advanced_features_enabled SET DEFAULT true;

-- Atualizar usuários existentes para ter funcionalidades avançadas ativadas
UPDATE public.user_profiles SET advanced_features_enabled = true WHERE advanced_features_enabled = false;

-- Criar função para criar cliente padrão quando um usuário é criado
CREATE OR REPLACE FUNCTION public.create_default_client_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar cliente padrão para o novo usuário
  INSERT INTO public.clients (
    user_id,
    name,
    phone,
    email,
    address,
    city,
    state,
    zip_code,
    is_default,
    is_favorite,
    notes
  ) VALUES (
    NEW.id,
    'Cliente Padrão',
    '(11) 99999-9999',
    'cliente.padrao@exemplo.com',
    'Rua Exemplo, 123',
    'São Paulo',
    'SP',
    '01234-567',
    true,
    false,
    'Cliente padrão criado automaticamente para demonstração'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar a função quando um usuário é criado
CREATE TRIGGER create_default_client_trigger
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_client_for_user();

-- Criar cliente padrão para usuários existentes que não têm nenhum cliente
INSERT INTO public.clients (user_id, name, phone, email, address, city, state, zip_code, is_default, is_favorite, notes)
SELECT 
  up.id,
  'Cliente Padrão',
  '(11) 99999-9999',
  'cliente.padrao@exemplo.com',
  'Rua Exemplo, 123',
  'São Paulo',
  'SP',
  '01234-567',
  true,
  false,
  'Cliente padrão criado automaticamente para demonstração'
FROM public.user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM public.clients c WHERE c.user_id = up.id
);