-- Inserir notificações de teste para debug
INSERT INTO notifications (title, message, type, target_type, created_by, is_active)
VALUES 
  ('Teste 1', 'Esta é uma notificação de teste 1', 'info', 'all', (SELECT id FROM auth.users LIMIT 1), true),
  ('Teste 2', 'Esta é uma notificação de teste 2', 'success', 'all', (SELECT id FROM auth.users LIMIT 1), true),
  ('Teste 3', 'Esta é uma notificação de teste 3', 'warning', 'all', (SELECT id FROM auth.users LIMIT 1), true);

-- Inserir registros na tabela user_notifications para o usuário atual
INSERT INTO user_notifications (user_id, notification_id, delivery_status)
SELECT 
  u.id as user_id,
  n.id as notification_id,
  'delivered' as delivery_status
FROM auth.users u
CROSS JOIN notifications n
WHERE n.title LIKE 'Teste%'
LIMIT 3;