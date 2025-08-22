-- Criar função admin_delete_notification para permitir que administradores deletem notificações
-- Date: 2025-01-19
-- Description: Função para deletar notificações no painel administrativo

-- Função para deletar notificação (apenas para administradores)
CREATE OR REPLACE FUNCTION admin_delete_notification(
  p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := false;
  v_notification_exists BOOLEAN := false;
BEGIN
  -- Obter o ID do usuário autenticado
  v_user_id := auth.uid();
  
  -- Verificar se o usuário está autenticado
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se o usuário é administrador
  SELECT 
    CASE 
      WHEN role = 'admin' OR role = 'super_admin' THEN true
      ELSE false
    END INTO v_is_admin
  FROM public.user_profiles 
  WHERE id = v_user_id;
  
  -- Se não encontrou o perfil ou não é admin
  IF NOT FOUND OR NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem deletar notificações';
  END IF;
  
  -- Verificar se a notificação existe
  SELECT EXISTS(
    SELECT 1 FROM public.notifications 
    WHERE id = p_notification_id
  ) INTO v_notification_exists;
  
  IF NOT v_notification_exists THEN
    RAISE EXCEPTION 'Notificação não encontrada';
  END IF;
  
  -- Deletar registros relacionados na tabela user_notifications primeiro
  DELETE FROM public.user_notifications 
  WHERE notification_id = p_notification_id;
  
  -- Deletar registros relacionados na tabela user_notifications_read
  DELETE FROM public.user_notifications_read 
  WHERE notification_id = p_notification_id;
  
  -- Deletar a notificação principal
  DELETE FROM public.notifications 
  WHERE id = p_notification_id;
  
  -- Verificar se a exclusão foi bem-sucedida
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Falha ao deletar a notificação';
  END IF;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro para debugging
    RAISE EXCEPTION 'Erro ao deletar notificação: %', SQLERRM;
END;
$$;

-- Conceder permissões para a função
GRANT EXECUTE ON FUNCTION admin_delete_notification(UUID) TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION admin_delete_notification(UUID) IS 'Função para deletar notificações - apenas para administradores';