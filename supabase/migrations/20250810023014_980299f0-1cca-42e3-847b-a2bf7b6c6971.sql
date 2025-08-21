
-- 1) Corrigir a função principal de listagem para o usuário atual
-- Removemos a versão anterior para evitar conflitos de assinatura/retorno
DROP FUNCTION IF EXISTS public.get_user_notifications(p_limit integer, p_offset integer);

CREATE OR REPLACE FUNCTION public.get_user_notifications(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
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
  read_at timestamptz
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
  ur.read_at
FROM visible v
LEFT JOIN public.user_notifications_read ur
  ON ur.notification_id = v.id
 AND ur.user_id = auth.uid()
 AND COALESCE(ur.is_deleted, false) = false
WHERE COALESCE(ur.is_deleted, false) = false
ORDER BY v.created_at DESC
LIMIT p_limit OFFSET p_offset;
$$;

COMMENT ON FUNCTION public.get_user_notifications(integer, integer)
IS 'Lista notificações visíveis para o usuário atual (ou todas se admin), com status de leitura.';

-- 2) Marcar notificação como lida
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(
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

  INSERT INTO public.user_notifications_read (id, user_id, notification_id, read_at, is_deleted)
  VALUES (gen_random_uuid(), v_user_id, p_notification_id, now(), false)
  ON CONFLICT (user_id, notification_id)
  DO UPDATE SET read_at = now(), is_deleted = false;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.mark_notification_as_read(uuid)
IS 'Marca a notificação como lida para o usuário atual.';

-- 3) "Excluir" notificação (ocultar) para o usuário
CREATE OR REPLACE FUNCTION public.delete_user_notification(
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

  INSERT INTO public.user_notifications_read (id, user_id, notification_id, read_at, is_deleted)
  VALUES (gen_random_uuid(), v_user_id, p_notification_id, now(), true)
  ON CONFLICT (user_id, notification_id)
  DO UPDATE SET is_deleted = true, read_at = COALESCE(user_notifications_read.read_at, now());

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.delete_user_notification(uuid)
IS 'Marca a notificação como excluída (oculta) para o usuário atual.';

-- 4) Admin: criar notificação
CREATE OR REPLACE FUNCTION public.admin_create_notification(
  p_title text,
  p_message text,
  p_type text,
  p_target_type text,
  p_target_user_id uuid DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem criar notificações';
  END IF;

  INSERT INTO public.notifications (
    id, title, message, type, target_type, target_user_id,
    created_by, expires_at, is_active
  )
  VALUES (
    gen_random_uuid(), p_title, p_message, p_type, p_target_type,
    p_target_user_id, auth.uid(), p_expires_at, true
  )
  RETURNING id INTO v_id;

  -- Se for específica, registrar em user_notifications (histórico/entrega)
  IF p_target_type = 'specific' AND p_target_user_id IS NOT NULL THEN
    INSERT INTO public.user_notifications (id, user_id, notification_id, delivery_status, sent_at)
    VALUES (gen_random_uuid(), p_target_user_id, v_id, 'sent', now());
  END IF;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.admin_create_notification(text, text, text, text, uuid, timestamptz)
IS 'Admin cria uma notificação (all/specific/push_enabled). Para specific, registra user_notifications.';

-- 5) Admin: listar notificações com paginação
CREATE OR REPLACE FUNCTION public.admin_list_notifications(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
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
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT
    n.id,
    n.title::text,
    n.message::text,
    n.type::text,
    n.target_type::text,
    n.target_user_id,
    n.created_by,
    n.expires_at,
    n.is_active,
    n.created_at,
    n.updated_at
  FROM public.notifications n
  LEFT JOIN public.user_notifications_read unr ON n.id = unr.notification_id
  WHERE n.is_active = true
    AND (unr.is_deleted IS NULL OR unr.is_deleted = false)
  ORDER BY n.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

COMMENT ON FUNCTION public.admin_list_notifications(integer, integer)
IS 'Lista de notificações (somente admin).';

-- 6) Admin: listar registros de user_notifications (histórico de envios/entregas)
CREATE OR REPLACE FUNCTION public.admin_list_user_notifications(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_notification_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_email text,
  notification_id uuid,
  notification_title text,
  notification_type text,
  delivery_status text,
  sent_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    un.id,
    un.user_id,
    COALESCE(au.email, '')::text as user_email,
    un.notification_id,
    n.title::text as notification_title,
    n.type::text as notification_type,
    un.delivery_status::text,
    un.sent_at,
    un.created_at
  FROM public.user_notifications un
  LEFT JOIN public.notifications n ON n.id = un.notification_id
  LEFT JOIN auth.users au ON au.id = un.user_id
  WHERE (p_notification_id IS NULL OR un.notification_id = p_notification_id)
    AND (p_user_id IS NULL OR un.user_id = p_user_id)
  ORDER BY un.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

COMMENT ON FUNCTION public.admin_list_user_notifications(integer, integer, uuid, uuid)
IS 'Lista user_notifications com dados do usuário e notificação (somente admin).';

-- 7) Índices úteis para leitura/ocultação por usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_user_notifications_read_user_notification'
  ) THEN
    CREATE INDEX idx_user_notifications_read_user_notification
      ON public.user_notifications_read (user_id, notification_id);
  END IF;
END$$;
