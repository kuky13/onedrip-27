-- Criar função segura para validar domínios permitidos
CREATE OR REPLACE FUNCTION public.get_allowed_redirect_domains()
RETURNS text[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  -- Lista de domínios permitidos para redirecionamento
  RETURN ARRAY[
    'https://lovable.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
END;
$$;

-- Função para validar se um domínio está na lista permitida
CREATE OR REPLACE FUNCTION public.is_domain_allowed(domain text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN domain = ANY(public.get_allowed_redirect_domains());
END;
$$;

-- Melhorar política RLS para verificar email confirmado em user_profiles
DROP POLICY IF EXISTS "rls_user_profiles_select" ON public.user_profiles;
CREATE POLICY "rls_user_profiles_select" 
ON public.user_profiles 
FOR SELECT 
USING (
  (id = auth.uid() OR is_current_user_admin())
  AND (
    -- Para admins, sem restrição de email
    is_current_user_admin() 
    OR 
    -- Para usuários normais, verificar se email foi confirmado
    (id = auth.uid() AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email_confirmed_at IS NOT NULL
    ))
  )
);

-- Melhorar política para budgets também
DROP POLICY IF EXISTS "rls_budgets_select" ON public.budgets;
CREATE POLICY "rls_budgets_select" 
ON public.budgets 
FOR SELECT 
USING (
  (
    (owner_id = auth.uid() AND deleted_at IS NULL) 
    OR is_current_user_admin()
  )
  AND (
    -- Para admins, sem restrição de email
    is_current_user_admin() 
    OR 
    -- Para usuários normais, verificar se email foi confirmado
    (owner_id = auth.uid() AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email_confirmed_at IS NOT NULL
    ))
  )
);

-- Função para log de auditoria de acessos administrativos
CREATE OR REPLACE FUNCTION public.log_admin_access(
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas logar se for admin
  IF is_current_user_admin() THEN
    INSERT INTO public.admin_logs (
      admin_user_id, 
      action, 
      details
    ) VALUES (
      auth.uid(),
      CONCAT(p_action, CASE WHEN p_resource_type IS NOT NULL THEN ' - ' || p_resource_type ELSE '' END),
      jsonb_build_object(
        'resource_type', p_resource_type,
        'resource_id', p_resource_id,
        'timestamp', now(),
        'details', p_details
      )
    );
  END IF;
END;
$$;