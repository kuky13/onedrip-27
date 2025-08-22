-- Fix soft delete functionality by updating get_user_notifications function
-- Date: 2025-01-20
-- Description: Update function to return user_notification_id for proper soft delete

-- Drop existing function
DROP FUNCTION IF EXISTS get_user_notifications(INTEGER, INTEGER);

-- Recreate function with correct return structure
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  user_notification_id UUID,
  notification_id UUID,
  title TEXT,
  message TEXT,
  type TEXT,
  target_type TEXT,
  target_user_id UUID,
  created_by UUID,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_read BOOLEAN,
  read_at TIMESTAMPTZ,
  user_deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Obter o ID do usuário autenticado
  v_user_id := auth.uid();
  
  -- Verificar se o usuário está autenticado
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  RETURN QUERY
  SELECT 
    n.id::TEXT,
    un.id as user_notification_id,
    n.id as notification_id,
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
    COALESCE(un.read_at IS NOT NULL, unr.read_at IS NOT NULL, false) as is_read,
    COALESCE(un.read_at, unr.read_at) as read_at,
    un.user_deleted_at
  FROM public.notifications n
  LEFT JOIN public.user_notifications un ON n.id = un.notification_id AND un.user_id = v_user_id
  LEFT JOIN public.user_notifications_read unr ON n.id = unr.notification_id AND unr.user_id = v_user_id
  WHERE 
    n.is_active = true
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    AND (
      -- Notificações para todos os usuários
      n.target_type = 'all' 
      -- Notificações específicas para este usuário
      OR (n.target_type = 'specific' AND n.target_user_id = v_user_id)
      -- Notificações push_enabled que foram enviadas para este usuário
      OR (n.target_type = 'push_enabled' AND un.user_id IS NOT NULL)
    )
    AND COALESCE(unr.is_deleted, false) = false  -- Excluir notificações deletadas
  ORDER BY n.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_user_notifications(INTEGER, INTEGER) TO authenticated;

-- Comentário
COMMENT ON FUNCTION get_user_notifications IS 'Função para obter notificações do usuário com user_notification_id para soft delete';