-- Drop the existing function first, then recreate with correct signature
DROP FUNCTION IF EXISTS public.get_user_notifications(integer,integer);

-- Create the corrected function to get user notifications (excluding deleted ones)
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_notifications(INTEGER, INTEGER) TO authenticated;