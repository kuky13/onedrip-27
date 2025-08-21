-- Fix delete_user_notification function ambiguity
-- Date: 2025-01-21
-- Description: Remove ambiguidade entre funções delete_user_notification(TEXT) e delete_user_notification(UUID)

-- 1. Remover a função que aceita TEXT para eliminar ambiguidade
DROP FUNCTION IF EXISTS public.delete_user_notification(TEXT);

-- 2. Garantir que apenas a função UUID existe e está correta
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
  -- Verificar se o usuário está autenticado
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se a notificação existe
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

  -- Marcar como deletada na tabela user_notifications_read
  INSERT INTO public.user_notifications_read (id, user_id, notification_id, read_at, is_deleted)
  VALUES (gen_random_uuid(), v_user_id, p_notification_id, NOW(), true)
  ON CONFLICT (user_id, notification_id) 
  DO UPDATE SET 
    is_deleted = true,
    read_at = COALESCE(user_notifications_read.read_at, NOW());

  RETURN true;
END;
$$;

-- 3. Conceder permissões
GRANT EXECUTE ON FUNCTION public.delete_user_notification(UUID) TO authenticated;

-- 4. Comentário para documentação
COMMENT ON FUNCTION public.delete_user_notification(UUID) 
IS 'Marca a notificação como excluída (oculta) para o usuário atual. Aceita apenas UUID.';

-- 5. Verificar se a função está funcionando corretamente
DO $$
BEGIN
  -- Testar se a função existe e tem a assinatura correta
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
  
  RAISE NOTICE 'Função delete_user_notification(UUID) criada com sucesso';
END $$;