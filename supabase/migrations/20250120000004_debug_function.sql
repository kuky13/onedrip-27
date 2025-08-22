-- Criar função de debug para verificar notificações sem autenticação
CREATE OR REPLACE FUNCTION debug_get_notifications()
RETURNS TABLE (
  notification_id UUID,
  title CHARACTER VARYING,
  message TEXT,
  type CHARACTER VARYING,
  target_type CHARACTER VARYING,
  is_active BOOLEAN,
  expires_at TIMESTAMPTZ,
  user_notifications_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id as notification_id,
    n.title,
    n.message,
    n.type,
    n.target_type,
    n.is_active,
    n.expires_at,
    COUNT(un.id) as user_notifications_count
  FROM notifications n
  LEFT JOIN user_notifications un ON n.id = un.notification_id
  GROUP BY n.id, n.title, n.message, n.type, n.target_type, n.is_active, n.expires_at
  ORDER BY n.created_at DESC;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION debug_get_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION debug_get_notifications() TO anon;

-- Executar função de debug
SELECT * FROM debug_get_notifications();