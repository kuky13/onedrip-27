-- Corrigir problema onde notificações enviadas não aparecem
-- Date: 2025-01-19
-- Description: Garantir que a função create_notification crie registros na tabela user_notifications

-- Atualizar a função create_notification para garantir que registros sejam criados na user_notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_title VARCHAR(255),
  p_message TEXT,
  p_type VARCHAR(20),
  p_target_type VARCHAR(20),
  p_target_user_id UUID DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
  v_user_role TEXT;
  v_sent_count INTEGER := 0;
BEGIN
  -- Verificar se o usuário é admin
  SELECT role INTO v_user_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem criar notificações';
  END IF;
  
  -- Validar parâmetros
  IF p_target_type = 'specific' AND p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'target_user_id é obrigatório quando target_type é specific';
  END IF;
  
  -- Inserir notificação
  INSERT INTO public.notifications (
    title, message, type, target_type, target_user_id, created_by, expires_at
  ) VALUES (
    p_title, p_message, p_type, p_target_type, p_target_user_id, auth.uid(), p_expires_at
  ) RETURNING id INTO v_notification_id;
  
  -- Processar envio baseado no target_type
  IF p_target_type = 'specific' AND p_target_user_id IS NOT NULL THEN
    -- Criar registro para usuário específico
    INSERT INTO user_notifications (
      user_id,
      notification_id,
      sent_at,
      delivery_status
    ) VALUES (
      p_target_user_id,
      v_notification_id,
      NOW(),
      'sent'
    ) ON CONFLICT (user_id, notification_id) DO NOTHING;
    
    v_sent_count := 1;
    
  ELSIF p_target_type = 'all' THEN
    -- Criar registros para todos os usuários ativos
    INSERT INTO user_notifications (user_id, notification_id, sent_at, delivery_status)
    SELECT up.id, v_notification_id, NOW(), 'sent'
    FROM user_profiles up
    WHERE up.id IS NOT NULL
    ON CONFLICT (user_id, notification_id) DO NOTHING;
    
    -- Contar quantos registros foram criados
    GET DIAGNOSTICS v_sent_count = ROW_COUNT;
    
  ELSIF p_target_type = 'push_enabled' THEN
    -- Criar registros para usuários com push notifications ativadas
    INSERT INTO user_notifications (user_id, notification_id, sent_at, delivery_status)
    SELECT ups.user_id, v_notification_id, NOW(), 'sent'
    FROM user_push_subscriptions ups
    WHERE ups.is_active = true
    ON CONFLICT (user_id, notification_id) DO NOTHING;
    
    -- Contar quantos registros foram criados
    GET DIAGNOSTICS v_sent_count = ROW_COUNT;
  END IF;
  
  RAISE NOTICE 'Notificação % criada. Registros criados na user_notifications: %', v_notification_id, v_sent_count;
  
  RETURN v_notification_id;
END;
$$;

-- Atualizar a função get_user_notifications para incluir notificações da tabela user_notifications
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
GRANT EXECUTE ON FUNCTION create_notification(VARCHAR, TEXT, VARCHAR, VARCHAR, UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications(INTEGER, INTEGER) TO authenticated;

-- Comentários
COMMENT ON FUNCTION create_notification IS 'Função para criar notificações garantindo registros na user_notifications';
COMMENT ON FUNCTION get_user_notifications IS 'Função para obter notificações do usuário incluindo da tabela user_notifications';

-- Verificar dados existentes
DO $$
DECLARE
    notification_count INTEGER;
    user_notification_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO notification_count FROM public.notifications;
    SELECT COUNT(*) INTO user_notification_count FROM public.user_notifications;
    RAISE NOTICE 'Total de notificações: %, Total de user_notifications: %', notification_count, user_notification_count;
END $$;