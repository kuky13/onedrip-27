-- Fix notifications bugs: add user_notification_id and soft delete filters
-- Description: Corrige função get_user_notifications para retornar user_notification_id e suportar filtros

-- 1) Atualizar função get_user_notifications para incluir user_notification_id e filtros
DROP FUNCTION IF EXISTS public.get_user_notifications(integer, integer);

CREATE OR REPLACE FUNCTION public.get_user_notifications(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_show_deleted boolean DEFAULT false
)
RETURNS TABLE (
  id uuid,
  title text,
  message text,
  type text,
  target_type text,
  target_user_id uuid,
  created_by uuid,
  expires_at timestamptz,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  is_read boolean,
  read_at timestamptz,
  user_notification_id uuid,
  is_deleted boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
WITH visible AS (
  SELECT n.*
  FROM public.notifications n
  WHERE
    CASE 
      WHEN public.is_current_user_admin() THEN true
      ELSE n.is_active = true
        AND (n.expires_at IS NULL OR n.expires_at > now())
        AND (
          n.target_type::text = 'all'
          OR (n.target_type::text = 'specific' AND n.target_user_id = auth.uid())
          OR (n.target_type::text = 'push_enabled' AND EXISTS (
                SELECT 1
                FROM public.user_push_subscriptions ups
                WHERE ups.user_id = auth.uid() AND ups.is_active = true
              ))
        )
    END
)
SELECT
  v.id,
  v.title::text,
  v.message::text,
  v.type::text,
  v.target_type::text,
  v.target_user_id,
  v.created_by,
  v.expires_at,
  v.is_active,
  v.created_at,
  v.updated_at,
  COALESCE(ur.read_at IS NOT NULL, false) AS is_read,
  ur.read_at,
  ur.id AS user_notification_id,
  COALESCE(ur.is_deleted, false) AS is_deleted
FROM visible v
LEFT JOIN public.user_notifications_read ur
  ON ur.notification_id = v.id
 AND ur.user_id = auth.uid()
WHERE 
  CASE 
    WHEN p_show_deleted THEN COALESCE(ur.is_deleted, false) = true
    ELSE COALESCE(ur.is_deleted, false) = false
  END
ORDER BY v.created_at DESC
LIMIT p_limit OFFSET p_offset;
$$;

COMMENT ON FUNCTION public.get_user_notifications(integer, integer, boolean)
IS 'Lista notificações visíveis para o usuário atual com user_notification_id e filtros de soft delete.';

-- 2) Adicionar função para restaurar notificação
CREATE OR REPLACE FUNCTION public.restore_user_notification(
  p_notification_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Atualizar o registro para marcar como não deletado
  UPDATE public.user_notifications_read
  SET is_deleted = false
  WHERE notification_id = p_notification_id 
    AND user_id = v_user_id;

  -- Se não existe registro, criar um novo
  IF NOT FOUND THEN
    INSERT INTO public.user_notifications_read (id, user_id, notification_id, read_at, is_deleted)
    VALUES (gen_random_uuid(), v_user_id, p_notification_id, null, false);
  END IF;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.restore_user_notification(uuid)
IS 'Restaura uma notificação da lixeira para o usuário atual.';

-- 3) Garantir permissões corretas
GRANT EXECUTE ON FUNCTION public.get_user_notifications(integer, integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_user_notification(uuid) TO authenticated;

-- 4) Verificar se as tabelas têm as permissões necessárias
GRANT SELECT, INSERT, UPDATE ON public.user_notifications_read TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;