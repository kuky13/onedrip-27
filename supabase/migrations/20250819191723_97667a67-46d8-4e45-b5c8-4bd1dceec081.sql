-- Fix notification deletion function to ensure proper UUID handling and functionality
-- This replaces any existing ambiguous functions

-- 1. Drop any existing ambiguous functions
DROP FUNCTION IF EXISTS public.delete_user_notification(TEXT);

-- 2. Create the correct UUID-based function
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
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Check if notification exists and user has permission
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

  -- Mark as deleted in user_notifications_read table (soft delete)
  INSERT INTO public.user_notifications_read (id, user_id, notification_id, read_at, is_deleted)
  VALUES (gen_random_uuid(), v_user_id, p_notification_id, NOW(), true)
  ON CONFLICT (user_id, notification_id) 
  DO UPDATE SET 
    is_deleted = true,
    read_at = COALESCE(user_notifications_read.read_at, NOW());

  RETURN true;
END;
$$;

-- 3. Create function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(
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
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Mark as read in user_notifications_read table
  INSERT INTO public.user_notifications_read (id, user_id, notification_id, read_at, is_deleted)
  VALUES (gen_random_uuid(), v_user_id, p_notification_id, NOW(), false)
  ON CONFLICT (user_id, notification_id) 
  DO UPDATE SET 
    read_at = NOW();

  RETURN true;
END;
$$;

-- 4. Create function to get user notifications (excluding deleted ones)
CREATE OR REPLACE FUNCTION public.get_user_notifications(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  title CHARACTER VARYING,
  message TEXT,
  type CHARACTER VARYING,
  target_type CHARACTER VARYING,
  target_user_id UUID,
  created_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN,
  read_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.type,
    n.target_type,
    n.target_user_id,
    n.created_by,
    n.expires_at,
    n.is_active,
    n.created_at,
    n.updated_at,
    COALESCE(unr.read_at IS NOT NULL, false) as is_read,
    unr.read_at
  FROM public.notifications n
  LEFT JOIN public.user_notifications_read unr ON (
    unr.notification_id = n.id 
    AND unr.user_id = v_user_id
  )
  WHERE 
    n.is_active = true
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    AND (
      n.target_type = 'all' 
      OR (n.target_type = 'specific' AND n.target_user_id = v_user_id)
      OR (n.target_type = 'push_enabled')
    )
    AND COALESCE(unr.is_deleted, false) = false  -- Exclude soft deleted notifications
  ORDER BY n.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION public.delete_user_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_as_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_notifications(INTEGER, INTEGER) TO authenticated;

-- 6. Add comments for documentation
COMMENT ON FUNCTION public.delete_user_notification(UUID) 
IS 'Soft deletes a notification for the current user by marking it as deleted in user_notifications_read';

COMMENT ON FUNCTION public.mark_notification_as_read(UUID) 
IS 'Marks a notification as read for the current user';

COMMENT ON FUNCTION public.get_user_notifications(INTEGER, INTEGER) 
IS 'Returns notifications for the current user, excluding soft deleted ones';