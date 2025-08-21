-- Remover as funções que usam auth.admin_update_user_by_id que não existe
DROP FUNCTION IF EXISTS public.admin_reset_user_password(uuid, text);
DROP FUNCTION IF EXISTS public.admin_change_user_email(uuid, text);

-- Criar novas funções que retornam apenas validação sem tentar usar funções internas
CREATE OR REPLACE FUNCTION public.validate_admin_password_reset(
  p_user_id uuid,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem redefinir senhas';
  END IF;

  -- Não permitir que admin altere sua própria senha desta forma
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Use o fluxo normal para alterar sua própria senha';
  END IF;

  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Log da ação
  PERFORM public.log_admin_action(
    p_user_id,
    'password_reset_attempt',
    jsonb_build_object('reset_method', 'admin_edge_function')
  );

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Criar função para validar alteração de email
CREATE OR REPLACE FUNCTION public.validate_admin_email_change(
  p_user_id uuid,
  p_new_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem alterar emails';
  END IF;

  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Verificar se o email já está em uso por outro usuário
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_new_email AND id != p_user_id) THEN
    RAISE EXCEPTION 'Este email já está sendo usado por outro usuário';
  END IF;

  -- Log da ação
  PERFORM public.log_admin_action(
    p_user_id,
    'email_change_attempt',
    jsonb_build_object('new_email', p_new_email)
  );

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id, 'new_email', p_new_email);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;