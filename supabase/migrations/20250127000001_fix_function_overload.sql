-- Fix function overload issue for get_user_notifications
-- Remove all existing versions and create a single clean version

-- Drop all possible versions of the function
DROP FUNCTION IF EXISTS public.get_user_notifications();
DROP FUNCTION IF EXISTS public.get_user_notifications(INTEGER);
DROP FUNCTION IF EXISTS public.get_user_notifications(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_user_notifications(INTEGER, INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS public.get_user_notifications(p_limit INTEGER, p_offset INTEGER);

-- Create the single, correct version
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_notifications(integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_notifications(integer, integer) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_user_notifications(integer, integer)
IS 'Lista notificações visíveis para o usuário atual (ou todas se admin), com status de leitura. Versão única para evitar conflitos de sobrecarga.';