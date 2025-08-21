-- Corrigir função delete_user_notification para usar tabela notifications
-- Date: 2025-01-19
-- Description: Atualizar função delete_user_notification para usar a tabela notifications correta

-- Função para deletar notificação do usuário (corrigida)
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
    SELECT 1 FROM public.notifications 
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
  INSERT INTO public.user_notifications_read (notification_id, user_id, read_at, is_deleted)
  VALUES (p_notification_id::UUID, v_user_id, NOW(), true)
  ON CONFLICT (notification_id, user_id) 
  DO UPDATE SET 
    is_deleted = true,
    read_at = COALESCE(user_notifications_read.read_at, NOW());
  
  RETURN true;
END;
$$;

-- Remover função existente primeiro
DROP FUNCTION IF EXISTS get_user_notifications();
DROP FUNCTION IF EXISTS get_user_notifications(INTEGER, INTEGER);

-- Atualizar a função get_user_notifications para usar a tabela notifications correta
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
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
  FROM public.notifications n
  LEFT JOIN public.user_notifications_read unr ON n.id = unr.notification_id AND unr.user_id = v_user_id
  WHERE 
    n.is_active = true
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    AND (
      n.target_type = 'all' 
      OR (n.target_type = 'specific' AND n.target_user_id = v_user_id)
    )
    AND COALESCE(unr.is_deleted, false) = false  -- Excluir notificações deletadas
  ORDER BY n.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION delete_user_notification(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications(INTEGER, INTEGER) TO authenticated;

-- Comentários para documentação
COMMENT ON FUNCTION delete_user_notification(TEXT) IS 'Função para deletar/ocultar notificação do usuário (corrigida para usar tabela notifications)';
COMMENT ON FUNCTION get_user_notifications(INTEGER, INTEGER) IS 'Função para obter notificações do usuário com paginação (corrigida para usar tabela notifications)';

-- Verificar se existem notificações
DO $$
DECLARE
    notification_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO notification_count FROM public.notifications;
    RAISE NOTICE 'Total de notificações na tabela: %', notification_count;
END $$;