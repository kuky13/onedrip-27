
-- Corrigir a lógica do is_active (TRUE = ativo, FALSE = inativo)
-- Atualizar usuários expirados para is_active = FALSE
UPDATE public.user_profiles 
SET is_active = FALSE 
WHERE expiration_date < NOW() AND is_active = TRUE;

-- Criar função para verificar e atualizar usuários expirados automaticamente
CREATE OR REPLACE FUNCTION public.update_expired_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_profiles 
  SET is_active = FALSE 
  WHERE expiration_date < NOW() AND is_active = TRUE;
END;
$$;

-- Criar trigger para executar a verificação sempre que houver consulta
CREATE OR REPLACE FUNCTION public.check_user_expiration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar se o usuário está expirado
  IF NEW.expiration_date < NOW() AND NEW.is_active = TRUE THEN
    NEW.is_active := FALSE;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger para verificar expiração em updates
DROP TRIGGER IF EXISTS check_expiration_trigger ON public.user_profiles;
CREATE TRIGGER check_expiration_trigger
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_expiration();

-- Garantir que novos usuários tenham 30 dias de licença
ALTER TABLE public.user_profiles 
ALTER COLUMN expiration_date SET DEFAULT (NOW() + INTERVAL '30 days');

-- Atualizar função de validação de licença para considerar a lógica correta
CREATE OR REPLACE FUNCTION public.is_license_valid(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_expiration timestamp with time zone;
  user_active boolean;
BEGIN
  -- Buscar dados do usuário
  SELECT expiration_date, is_active 
  INTO user_expiration, user_active
  FROM public.user_profiles 
  WHERE id = p_user_id;

  -- Se usuário não encontrado, licença inválida
  IF user_expiration IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verificar se está ativo e não expirado
  RETURN user_active = TRUE AND user_expiration > NOW();
END;
$$;

-- Criar função para executar limpeza periódica de usuários expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_profiles 
  SET is_active = FALSE 
  WHERE expiration_date < NOW() AND is_active = TRUE;
  
  -- Log da limpeza
  RAISE NOTICE 'Expired users cleanup completed at %', NOW();
END;
$$;
