-- Funções SQL para o Sistema de Gerenciamento de Licenças
-- Criado em: 2025-01-20
-- Descrição: Funções avançadas para gerenciamento completo de licenças

-- 1. Função para buscar todas as licenças com detalhes do usuário
CREATE OR REPLACE FUNCTION admin_get_all_licenses()
RETURNS TABLE (
  id uuid,
  code text,
  user_id uuid,
  user_name text,
  user_email text,
  is_active boolean,
  expires_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar todas as licenças';
  END IF;

  RETURN QUERY
  SELECT 
    l.id,
    l.code,
    l.user_id,
    COALESCE(up.name, 'Usuário não encontrado') as user_name,
    COALESCE(au.email, 'Email não encontrado') as user_email,
    l.is_active,
    l.expires_at,
    l.created_at,
    l.updated_at,
    l.notes
  FROM public.licenses l
  LEFT JOIN public.user_profiles up ON l.user_id = up.id
  LEFT JOIN auth.users au ON l.user_id = au.id
  ORDER BY l.created_at DESC;
END;
$$;

-- 2. Função para criar licença avançada
CREATE OR REPLACE FUNCTION admin_create_license_advanced(
  p_code text,
  p_expires_at timestamp with time zone DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_notes text DEFAULT '',
  p_activate_immediately boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_license_id uuid;
  admin_user_id uuid;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem criar licenças';
  END IF;

  -- Obter ID do admin atual
  admin_user_id := auth.uid();

  -- Verificar se o código já existe
  IF EXISTS (SELECT 1 FROM public.licenses WHERE code = p_code) THEN
    RAISE EXCEPTION 'Código de licença já existe: %', p_code;
  END IF;

  -- Verificar se o usuário existe (se fornecido)
  IF p_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', p_user_id;
  END IF;

  -- Criar a licença
  INSERT INTO public.licenses (
    code,
    user_id,
    is_active,
    expires_at,
    notes,
    created_at,
    updated_at
  ) VALUES (
    p_code,
    p_user_id,
    p_activate_immediately,
    p_expires_at,
    p_notes,
    NOW(),
    NOW()
  ) RETURNING id INTO new_license_id;

  -- Registrar no histórico
  INSERT INTO public.license_history (
    license_id,
    action_type,
    admin_id,
    notes,
    created_at
  ) VALUES (
    new_license_id,
    'created',
    admin_user_id,
    COALESCE(p_notes, 'Licença criada'),
    NOW()
  );

  RETURN new_license_id;
END;
$$;

-- 3. Função para criar múltiplas licenças
CREATE OR REPLACE FUNCTION admin_create_multiple_licenses(
  p_quantity integer,
  p_expires_at timestamp with time zone DEFAULT NULL,
  p_notes text DEFAULT '',
  p_activate_immediately boolean DEFAULT true
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  i integer;
  license_code text;
  new_license_id uuid;
  admin_user_id uuid;
  created_count integer := 0;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem criar licenças';
  END IF;

  -- Validar quantidade
  IF p_quantity <= 0 OR p_quantity > 100 THEN
    RAISE EXCEPTION 'Quantidade deve estar entre 1 e 100';
  END IF;

  -- Obter ID do admin atual
  admin_user_id := auth.uid();

  -- Criar licenças em loop
  FOR i IN 1..p_quantity LOOP
    -- Gerar código único
    LOOP
      license_code := (
        SELECT string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', ceil(random()*36)::integer, 1), '')
        FROM generate_series(1, 16)
      );
      
      -- Formatar código (XXXX-XXXX-XXXX-XXXX)
      license_code := substr(license_code, 1, 4) || '-' || 
                     substr(license_code, 5, 4) || '-' || 
                     substr(license_code, 9, 4) || '-' || 
                     substr(license_code, 13, 4);
      
      -- Verificar se é único
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.licenses WHERE code = license_code);
    END LOOP;

    -- Criar a licença
    INSERT INTO public.licenses (
      code,
      user_id,
      is_active,
      expires_at,
      notes,
      created_at,
      updated_at
    ) VALUES (
      license_code,
      NULL,
      p_activate_immediately,
      p_expires_at,
      p_notes,
      NOW(),
      NOW()
    ) RETURNING id INTO new_license_id;

    -- Registrar no histórico
    INSERT INTO public.license_history (
      license_id,
      action_type,
      admin_id,
      notes,
      created_at
    ) VALUES (
      new_license_id,
      'created',
      admin_user_id,
      'Licença criada em lote: ' || COALESCE(p_notes, ''),
      NOW()
    );

    created_count := created_count + 1;
  END LOOP;

  RETURN created_count;
END;
$$;

-- 4. Função para atualizar licença
CREATE OR REPLACE FUNCTION admin_update_license(
  p_license_id uuid,
  p_code text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_expires_at timestamp with time zone DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
  old_record record;
  changes_made text := '';
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem atualizar licenças';
  END IF;

  -- Obter ID do admin atual
  admin_user_id := auth.uid();

  -- Buscar registro atual
  SELECT * INTO old_record FROM public.licenses WHERE id = p_license_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Licença não encontrada: %', p_license_id;
  END IF;

  -- Verificar se o novo código já existe (se fornecido)
  IF p_code IS NOT NULL AND p_code != old_record.code THEN
    IF EXISTS (SELECT 1 FROM public.licenses WHERE code = p_code AND id != p_license_id) THEN
      RAISE EXCEPTION 'Código de licença já existe: %', p_code;
    END IF;
  END IF;

  -- Verificar se o usuário existe (se fornecido)
  IF p_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', p_user_id;
  END IF;

  -- Atualizar campos fornecidos
  UPDATE public.licenses SET
    code = COALESCE(p_code, code),
    user_id = CASE WHEN p_user_id IS NOT NULL THEN p_user_id ELSE user_id END,
    is_active = COALESCE(p_is_active, is_active),
    expires_at = CASE WHEN p_expires_at IS NOT NULL THEN p_expires_at ELSE expires_at END,
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = p_license_id;

  -- Construir descrição das mudanças
  IF p_code IS NOT NULL AND p_code != old_record.code THEN
    changes_made := changes_made || 'Código alterado de ' || old_record.code || ' para ' || p_code || '; ';
  END IF;
  
  IF p_is_active IS NOT NULL AND p_is_active != old_record.is_active THEN
    changes_made := changes_made || 'Status alterado para ' || CASE WHEN p_is_active THEN 'ativo' ELSE 'inativo' END || '; ';
  END IF;

  -- Registrar no histórico
  INSERT INTO public.license_history (
    license_id,
    action_type,
    admin_id,
    old_values,
    new_values,
    notes,
    created_at
  ) VALUES (
    p_license_id,
    'updated',
    admin_user_id,
    jsonb_build_object(
      'code', old_record.code,
      'user_id', old_record.user_id,
      'is_active', old_record.is_active,
      'expires_at', old_record.expires_at
    ),
    jsonb_build_object(
      'code', COALESCE(p_code, old_record.code),
      'user_id', COALESCE(p_user_id, old_record.user_id),
      'is_active', COALESCE(p_is_active, old_record.is_active),
      'expires_at', COALESCE(p_expires_at, old_record.expires_at)
    ),
    COALESCE(changes_made, 'Licença atualizada'),
    NOW()
  );

  RETURN true;
END;
$$;

-- 5. Função para estender licença
CREATE OR REPLACE FUNCTION admin_extend_license(
  p_license_id uuid,
  p_days integer,
  p_notes text DEFAULT ''
)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
  current_expires_at timestamp with time zone;
  new_expires_at timestamp with time zone;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem estender licenças';
  END IF;

  -- Obter ID do admin atual
  admin_user_id := auth.uid();

  -- Buscar data de expiração atual
  SELECT expires_at INTO current_expires_at 
  FROM public.licenses 
  WHERE id = p_license_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Licença não encontrada: %', p_license_id;
  END IF;

  -- Calcular nova data de expiração
  IF current_expires_at IS NULL THEN
    new_expires_at := NOW() + (p_days || ' days')::interval;
  ELSE
    new_expires_at := current_expires_at + (p_days || ' days')::interval;
  END IF;

  -- Atualizar licença
  UPDATE public.licenses SET
    expires_at = new_expires_at,
    updated_at = NOW()
  WHERE id = p_license_id;

  -- Registrar no histórico
  INSERT INTO public.license_history (
    license_id,
    action_type,
    admin_id,
    old_values,
    new_values,
    notes,
    created_at
  ) VALUES (
    p_license_id,
    'extended',
    admin_user_id,
    jsonb_build_object('expires_at', current_expires_at),
    jsonb_build_object('expires_at', new_expires_at),
    'Licença estendida por ' || p_days || ' dias. ' || COALESCE(p_notes, ''),
    NOW()
  );

  RETURN new_expires_at;
END;
$$;

-- 6. Função para transferir licença
CREATE OR REPLACE FUNCTION admin_transfer_license(
  p_license_id uuid,
  p_new_user_id uuid,
  p_notes text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
  old_user_id uuid;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem transferir licenças';
  END IF;

  -- Obter ID do admin atual
  admin_user_id := auth.uid();

  -- Verificar se a licença existe
  SELECT user_id INTO old_user_id 
  FROM public.licenses 
  WHERE id = p_license_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Licença não encontrada: %', p_license_id;
  END IF;

  -- Verificar se o novo usuário existe
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_new_user_id) THEN
    RAISE EXCEPTION 'Usuário de destino não encontrado: %', p_new_user_id;
  END IF;

  -- Transferir licença
  UPDATE public.licenses SET
    user_id = p_new_user_id,
    updated_at = NOW()
  WHERE id = p_license_id;

  -- Registrar no histórico
  INSERT INTO public.license_history (
    license_id,
    action_type,
    admin_id,
    old_values,
    new_values,
    notes,
    created_at
  ) VALUES (
    p_license_id,
    'transferred',
    admin_user_id,
    jsonb_build_object('user_id', old_user_id),
    jsonb_build_object('user_id', p_new_user_id),
    'Licença transferida. ' || COALESCE(p_notes, ''),
    NOW()
  );

  RETURN true;
END;
$$;

-- 7. Função para buscar histórico de licença
CREATE OR REPLACE FUNCTION admin_get_license_history(
  p_license_id uuid
)
RETURNS TABLE (
  id uuid,
  action_type text,
  admin_id uuid,
  admin_name text,
  admin_email text,
  old_values jsonb,
  new_values jsonb,
  notes text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar histórico';
  END IF;

  RETURN QUERY
  SELECT 
    lh.id,
    lh.action_type,
    lh.admin_id,
    COALESCE(up.name, 'Admin não encontrado') as admin_name,
    COALESCE(au.email, 'Email não encontrado') as admin_email,
    lh.old_values,
    lh.new_values,
    lh.notes,
    lh.created_at
  FROM public.license_history lh
  LEFT JOIN public.user_profiles up ON lh.admin_id = up.id
  LEFT JOIN auth.users au ON lh.admin_id = au.id
  WHERE lh.license_id = p_license_id
  ORDER BY lh.created_at DESC;
END;
$$;

-- 8. Função para ações em massa
CREATE OR REPLACE FUNCTION admin_bulk_license_action(
  p_license_ids uuid[],
  p_action text,
  p_value boolean DEFAULT NULL,
  p_notes text DEFAULT ''
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
  license_id uuid;
  affected_count integer := 0;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar ações em massa';
  END IF;

  -- Obter ID do admin atual
  admin_user_id := auth.uid();

  -- Validar ação
  IF p_action NOT IN ('activate', 'deactivate') THEN
    RAISE EXCEPTION 'Ação inválida: %', p_action;
  END IF;

  -- Executar ação para cada licença
  FOREACH license_id IN ARRAY p_license_ids LOOP
    -- Verificar se a licença existe
    IF EXISTS (SELECT 1 FROM public.licenses WHERE id = license_id) THEN
      -- Executar ação
      IF p_action = 'activate' THEN
        UPDATE public.licenses SET is_active = true, updated_at = NOW() WHERE id = license_id;
      ELSIF p_action = 'deactivate' THEN
        UPDATE public.licenses SET is_active = false, updated_at = NOW() WHERE id = license_id;
      END IF;

      -- Registrar no histórico
      INSERT INTO public.license_history (
        license_id,
        action_type,
        admin_id,
        notes,
        created_at
      ) VALUES (
        license_id,
        p_action,
        admin_user_id,
        'Ação em massa: ' || p_action || '. ' || COALESCE(p_notes, ''),
        NOW()
      );

      affected_count := affected_count + 1;
    END IF;
  END LOOP;

  RETURN affected_count;
END;
$$;

-- 9. Função para estatísticas de licenças
CREATE OR REPLACE FUNCTION admin_get_license_stats()
RETURNS TABLE (
  total_licenses bigint,
  active_licenses bigint,
  inactive_licenses bigint,
  expired_licenses bigint,
  expiring_soon bigint,
  unassigned_licenses bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar estatísticas';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*) as total_licenses,
    COUNT(*) FILTER (WHERE is_active = true) as active_licenses,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_licenses,
    COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at < NOW()) as expired_licenses,
    COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days') as expiring_soon,
    COUNT(*) FILTER (WHERE user_id IS NULL) as unassigned_licenses
  FROM public.licenses;
END;
$$;

-- 10. Criar tabela de histórico de licenças se não existir
CREATE TABLE IF NOT EXISTS public.license_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id uuid NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  admin_id uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_license_history_license_id ON public.license_history(license_id);
CREATE INDEX IF NOT EXISTS idx_license_history_admin_id ON public.license_history(admin_id);
CREATE INDEX IF NOT EXISTS idx_license_history_created_at ON public.license_history(created_at);
CREATE INDEX IF NOT EXISTS idx_license_history_action_type ON public.license_history(action_type);

-- Habilitar RLS na tabela de histórico
ALTER TABLE public.license_history ENABLE ROW LEVEL SECURITY;

-- Política RLS para histórico de licenças
CREATE POLICY "Admins can view license history" ON public.license_history
  FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "Admins can insert license history" ON public.license_history
  FOR INSERT WITH CHECK (public.is_current_user_admin());

-- Conceder permissões
GRANT SELECT, INSERT ON public.license_history TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Comentários nas funções
COMMENT ON FUNCTION admin_get_all_licenses() IS 'Busca todas as licenças com detalhes do usuário para administradores';
COMMENT ON FUNCTION admin_create_license_advanced(text, timestamp with time zone, uuid, text, boolean) IS 'Cria uma nova licença com configurações avançadas';
COMMENT ON FUNCTION admin_create_multiple_licenses(integer, timestamp with time zone, text, boolean) IS 'Cria múltiplas licenças de uma vez';
COMMENT ON FUNCTION admin_update_license(uuid, text, uuid, boolean, timestamp with time zone, text) IS 'Atualiza uma licença existente';
COMMENT ON FUNCTION admin_extend_license(uuid, integer, text) IS 'Estende a validade de uma licença por X dias';
COMMENT ON FUNCTION admin_transfer_license(uuid, uuid, text) IS 'Transfere uma licença para outro usuário';
COMMENT ON FUNCTION admin_get_license_history(uuid) IS 'Busca o histórico de alterações de uma licença';
COMMENT ON FUNCTION admin_bulk_license_action(uuid[], text, boolean, text) IS 'Executa ações em massa em múltiplas licenças';
COMMENT ON FUNCTION admin_get_license_stats() IS 'Retorna estatísticas gerais das licenças';