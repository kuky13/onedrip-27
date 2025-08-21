-- Função para deletar notificação do usuário
CREATE OR REPLACE FUNCTION delete_user_notification(
  p_notification_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_notification_exists BOOLEAN;
BEGIN
  -- Obter o ID do usuário autenticado
  v_user_id := auth.uid();
  
  -- Verificar se o usuário está autenticado
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se a notificação existe e pertence ao usuário ou é uma notificação global
  SELECT EXISTS(
    SELECT 1 FROM admin_notifications 
    WHERE id = p_notification_id::UUID
    AND (
      target_type = 'all' 
      OR (target_type = 'specific' AND target_user_id = v_user_id)
    )
    AND is_active = true
  ) INTO v_notification_exists;
  
  IF NOT v_notification_exists THEN
    RAISE EXCEPTION 'Notificação não encontrada ou sem permissão para excluir';
  END IF;
  
  -- Para notificações globais, criar/atualizar registro de leitura como "deletada"
  -- Para notificações específicas, desativar a notificação
  INSERT INTO user_notifications_read (notification_id, user_id, read_at, is_deleted)
  VALUES (p_notification_id::UUID, v_user_id, NOW(), true)
  ON CONFLICT (notification_id, user_id) 
  DO UPDATE SET 
    is_deleted = true,
    read_at = COALESCE(user_notifications_read.read_at, NOW());
  
  RETURN true;
END;
$$;

-- Adicionar coluna is_deleted na tabela user_notifications_read se não existir
ALTER TABLE user_notifications_read 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Atualizar a função get_user_notifications para excluir notificações deletadas
CREATE OR REPLACE FUNCTION get_user_notifications()
RETURNS TABLE (
  id TEXT,
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
  read_at TIMESTAMPTZ
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
  FROM admin_notifications n
  LEFT JOIN user_notifications_read unr ON n.id = unr.notification_id AND unr.user_id = v_user_id
  WHERE 
    n.is_active = true
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    AND (
      n.target_type = 'all' 
      OR (n.target_type = 'specific' AND n.target_user_id = v_user_id)
    )
    AND COALESCE(unr.is_deleted, false) = false  -- Excluir notificações deletadas
  ORDER BY n.created_at DESC;
END;
$$;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION delete_user_notification(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications() TO authenticated;

-- Comentários para documentação
COMMENT ON FUNCTION delete_user_notification(TEXT) IS 'Função para deletar/ocultar notificação do usuário';
COMMENT ON FUNCTION get_user_notifications() IS 'Função atualizada para obter notificações do usuário excluindo as deletadas';