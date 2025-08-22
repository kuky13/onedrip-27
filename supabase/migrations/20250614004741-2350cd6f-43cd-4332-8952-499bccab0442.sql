
-- 1. Criar função para verificar se usuário é admin (necessária para evitar recursão RLS)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

-- 2. Criar políticas RLS para admins gerenciarem user_profiles
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON public.user_profiles;

CREATE POLICY "Admins can view all user profiles" ON public.user_profiles
  FOR SELECT USING (
    id = auth.uid() OR public.is_current_user_admin()
  );

CREATE POLICY "Admins can update all user profiles" ON public.user_profiles
  FOR UPDATE USING (
    id = auth.uid() OR public.is_current_user_admin()
  );

CREATE POLICY "Admins can delete user profiles" ON public.user_profiles
  FOR DELETE USING (public.is_current_user_admin());

-- 3. Criar função para listar todos os usuários (apenas para admins)
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  is_active boolean,
  expiration_date timestamp with time zone,
  created_at timestamp with time zone,
  last_sign_in_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar todos os usuários';
  END IF;

  RETURN QUERY
  SELECT 
    up.id,
    up.name,
    au.email,
    up.role,
    up.is_active,
    up.expiration_date,
    up.created_at,
    au.last_sign_in_at
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON up.id = au.id
  ORDER BY up.created_at DESC;
END;
$$;

-- 4. Criar função para atualizar dados do usuário (apenas para admins)
CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id uuid,
  p_name text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_expiration_date timestamp with time zone DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem atualizar usuários';
  END IF;

  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Atualizar apenas os campos fornecidos
  UPDATE public.user_profiles
  SET 
    name = COALESCE(p_name, name),
    role = COALESCE(p_role, role),
    is_active = COALESCE(p_is_active, is_active),
    expiration_date = COALESCE(p_expiration_date, expiration_date),
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- 5. Criar função para deletar usuário (apenas para admins)
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem deletar usuários';
  END IF;

  -- Não permitir que admin delete a si mesmo
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Não é possível deletar sua própria conta';
  END IF;

  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Deletar orçamentos do usuário primeiro (devido às foreign keys)
  DELETE FROM public.budget_parts 
  WHERE budget_id IN (SELECT id FROM public.budgets WHERE owner_id = p_user_id);
  
  DELETE FROM public.budgets WHERE owner_id = p_user_id;
  
  -- Deletar perfil do usuário
  DELETE FROM public.user_profiles WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- 6. Criar função para verificar validade da licença
CREATE OR REPLACE FUNCTION public.is_license_valid(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_expiration timestamp with time zone;
  user_active boolean;
BEGIN
  -- Buscar dados do usuário
  SELECT expiration_date, is_active 
  INTO user_expiration, user_active
  FROM public.user_profiles 
  WHERE id = p_user_id;

  -- Se usuário não encontrado, licença inválida
  IF user_expiration IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verificar se está ativo e não expirado
  RETURN user_active = TRUE AND user_expiration > NOW();
END;
$$;

-- 7. Criar função para logs de ações administrativas
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id),
  target_user_id uuid,
  action text NOT NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT NOW()
);

-- Habilitar RLS na tabela de logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Política para que apenas admins vejam os logs
CREATE POLICY "Admins can view admin logs" ON public.admin_logs
  FOR SELECT USING (public.is_current_user_admin());

-- 8. Criar função para registrar logs de ações administrativas
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_target_user_id uuid,
  p_action text,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.admin_logs (admin_user_id, target_user_id, action, details)
  VALUES (auth.uid(), p_target_user_id, p_action, p_details);
END;
$$;

-- 9. Criar trigger para log automático de alterações em user_profiles
CREATE OR REPLACE FUNCTION public.log_user_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Apenas logar se não for o próprio usuário alterando seu perfil
  IF auth.uid() != NEW.id THEN
    PERFORM public.log_admin_action(
      NEW.id,
      'user_profile_updated',
      jsonb_build_object(
        'old_values', to_jsonb(OLD),
        'new_values', to_jsonb(NEW)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger
DROP TRIGGER IF EXISTS log_user_profile_changes_trigger ON public.user_profiles;
CREATE TRIGGER log_user_profile_changes_trigger
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_profile_changes();

-- 10. Atualizar função de validação para verificar licença no login
CREATE OR REPLACE FUNCTION public.validate_user_access()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar se a licença é válida durante qualquer operação
  IF NOT public.is_license_valid(NEW.id) THEN
    RAISE EXCEPTION 'Licença expirada ou usuário inativo';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 11. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_expiration_date ON public.user_profiles(expiration_date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON public.admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_user_id ON public.admin_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at);

-- 12. Garantir que o campo expiration_date tenha um valor padrão de 30 dias para novos usuários
ALTER TABLE public.user_profiles 
ALTER COLUMN expiration_date SET DEFAULT (NOW() + INTERVAL '30 days');

-- 13. Atualizar trigger de criação de usuário para definir expiração padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, role, expiration_date, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email, 'Usuário'),
    'user',
    NOW() + INTERVAL '30 days',
    true
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não bloqueia o signup
    RAISE WARNING 'Erro ao criar perfil do usuário: %', SQLERRM;
    RETURN NEW;
END;
$$;
