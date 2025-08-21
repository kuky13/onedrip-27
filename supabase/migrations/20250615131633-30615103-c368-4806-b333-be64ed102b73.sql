
-- Função para renovar a licença de um usuário por um número específico de dias.
CREATE OR REPLACE FUNCTION public.admin_renew_user_license(
  p_user_id uuid,
  p_additional_days integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_expiration_date timestamp with time zone;
  current_expiration_date timestamp with time zone;
BEGIN
  -- 1. Verificar se o usuário que executa a função é um administrador.
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem renovar licenças.';
  END IF;

  -- 2. Obter a data de expiração atual do usuário alvo.
  SELECT expiration_date INTO current_expiration_date
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário com ID % não encontrado.', p_user_id;
  END IF;

  -- 3. Calcular a nova data de expiração.
  -- Se a licença já expirou, a renovação começa a partir de hoje.
  -- Caso contrário, os dias são adicionados à data de expiração existente.
  IF current_expiration_date < NOW() THEN
    new_expiration_date := NOW() + (p_additional_days || ' days')::interval;
  ELSE
    new_expiration_date := current_expiration_date + (p_additional_days || ' days')::interval;
  END IF;

  -- 4. Atualizar o perfil do usuário com a nova data e reativá-lo.
  UPDATE public.user_profiles
  SET 
    expiration_date = new_expiration_date,
    is_active = TRUE, -- Garante que o usuário seja reativado caso a licença estivesse expirada.
    updated_at = NOW()
  WHERE id = p_user_id;

  -- 5. Registrar a ação no log de auditoria para rastreabilidade.
  PERFORM public.log_admin_action(
    p_user_id,
    'user_license_renewed',
    jsonb_build_object(
      'additional_days', p_additional_days,
      'old_expiration_date', current_expiration_date,
      'new_expiration_date', new_expiration_date
    )
  );

  RETURN TRUE;
END;
$$;
