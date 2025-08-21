-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
-- Copie e cole este script inteiro no SQL Editor do Supabase e execute

-- 1. Remove a função ambígua que aceita parâmetro TEXT
DROP FUNCTION IF EXISTS public.delete_user_notification(TEXT);

-- 2. Garante que apenas a versão UUID existe e está correta
CREATE OR REPLACE FUNCTION public.delete_user_notification(
  p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  -- Verifica se o usuário está autenticado
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verifica se a notificação existe e o usuário tem permissão
  IF NOT EXISTS (
    SELECT 1 FROM public.notifications 
    WHERE id = p_notification_id
    AND (
      target_type = 'all' 
      OR (target_type = 'specific' AND target_user_id = v_user_id)
      OR (target_type = 'push_enabled')
    )
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Notificação não encontrada ou sem permissão para excluir';
  END IF;

  -- Marca como excluída na tabela user_notifications_read
  INSERT INTO public.user_notifications_read (id, user_id, notification_id, read_at, is_deleted)
  VALUES (gen_random_uuid(), v_user_id, p_notification_id, NOW(), true)
  ON CONFLICT (user_id, notification_id) 
  DO UPDATE SET 
    is_deleted = true,
    read_at = COALESCE(user_notifications_read.read_at, NOW());

  RETURN true;
END;
$$;

-- 3. Concede permissões
GRANT EXECUTE ON FUNCTION public.delete_user_notification(UUID) TO authenticated;

-- 4. Adiciona comentário de documentação
COMMENT ON FUNCTION public.delete_user_notification(UUID) 
IS 'Marca a notificação como excluída (oculta) para o usuário atual. Aceita apenas UUID.';

-- 5. Verifica se a função foi criada corretamente
DO $$
BEGIN
  -- Verifica se a função existe com a assinatura correta
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'delete_user_notification'
    AND array_length(p.proargtypes, 1) = 1
    AND p.proargtypes[0] = 'uuid'::regtype
  ) THEN
    RAISE EXCEPTION 'Função delete_user_notification(UUID) não foi criada corretamente';
  END IF;
  
  -- Verifica se ainda existem versões TEXT
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'delete_user_notification'
    AND array_length(p.proargtypes, 1) = 1
    AND p.proargtypes[0] = 'text'::regtype
  ) THEN
    RAISE EXCEPTION 'Ainda existe uma função delete_user_notification(TEXT) - ambiguidade não resolvida';
  END IF;
  
  RAISE NOTICE 'SUCESSO: Função delete_user_notification(UUID) criada com sucesso e ambiguidade resolvida!';
END $$;

-- 6. Mostra a assinatura atual da função para confirmação
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'delete_user_notification';