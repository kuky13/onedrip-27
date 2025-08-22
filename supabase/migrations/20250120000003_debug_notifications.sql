-- Debug: Verificar dados nas tabelas de notificações

-- Verificar notificações na tabela principal
SELECT 'notifications' as tabela, COUNT(*) as total FROM notifications;

-- Verificar user_notifications
SELECT 'user_notifications' as tabela, COUNT(*) as total FROM user_notifications;

-- Verificar usuários
SELECT 'users' as tabela, COUNT(*) as total FROM auth.users;

-- Testar função get_user_notifications
SELECT * FROM get_user_notifications(10, 0);

-- Verificar notificações ativas
SELECT 
  n.id,
  n.title,
  n.is_active,
  n.target_type,
  n.expires_at,
  CASE WHEN n.expires_at IS NULL OR n.expires_at > NOW() THEN 'válida' ELSE 'expirada' END as status_expiracao
FROM notifications n
ORDER BY n.created_at DESC;