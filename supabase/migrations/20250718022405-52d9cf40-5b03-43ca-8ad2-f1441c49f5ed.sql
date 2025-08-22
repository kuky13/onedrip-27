
-- Função para admin resetar senha de usuário sem verificação
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
  p_user_id uuid,
  p_new_password text
)
RETURNS boolean
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

  -- Atualizar senha usando função administrativa do Supabase
  PERFORM auth.admin_update_user_by_id(
    p_user_id,
    jsonb_build_object('password', p_new_password)
  );

  -- Log da ação
  PERFORM public.log_admin_action(
    p_user_id,
    'password_reset_by_admin',
    jsonb_build_object('reset_method', 'admin_direct')
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao redefinir senha: %', SQLERRM;
END;
$$;

-- Função para admin alterar email do usuário
CREATE OR REPLACE FUNCTION public.admin_change_user_email(
  p_user_id uuid,
  p_new_email text
)
RETURNS boolean
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

  -- Verificar se o email já está em uso
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_new_email AND id != p_user_id) THEN
    RAISE EXCEPTION 'Este email já está sendo usado por outro usuário';
  END IF;

  -- Atualizar email usando função administrativa do Supabase
  PERFORM auth.admin_update_user_by_id(
    p_user_id,
    jsonb_build_object(
      'email', p_new_email,
      'email_confirmed_at', now()
    )
  );

  -- Log da ação
  PERFORM public.log_admin_action(
    p_user_id,
    'email_changed_by_admin',
    jsonb_build_object('new_email', p_new_email)
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao alterar email: %', SQLERRM;
END;
$$;
