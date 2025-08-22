-- FASE 1A: CORRIGIR FUNÇÕES CRÍTICAS (sem parâmetros conflitantes)
-- ================================================================

-- Corrigir função is_current_user_admin (mais crítica)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$;

-- Corrigir função is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

-- Corrigir função generate_license_code
CREATE OR REPLACE FUNCTION public.generate_license_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code_prefix TEXT := 'OLV';
  random_part TEXT;
  full_code TEXT;
BEGIN
  -- Gerar parte aleatória
  random_part := UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 8));
  full_code := code_prefix || '-' || random_part;
  
  -- Verificar se já existe
  WHILE EXISTS (SELECT 1 FROM public.licenses WHERE code = full_code) LOOP
    random_part := UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 8));
    full_code := code_prefix || '-' || random_part;
  END LOOP;
  
  RETURN full_code;
END;
$$;

-- RESTRINGIR POLÍTICAS PERMISSIVAS
-- ================================

-- Corrigir política da tabela rate_limit_tracking (muito permissiva)
DROP POLICY IF EXISTS "System can manage rate limiting" ON public.rate_limit_tracking;

CREATE POLICY "rate_limit_insert_only" 
ON public.rate_limit_tracking 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "rate_limit_select_own" 
ON public.rate_limit_tracking 
FOR SELECT 
USING (identifier = COALESCE(auth.jwt() ->> 'email', auth.uid()::text));

CREATE POLICY "rate_limit_update_own" 
ON public.rate_limit_tracking 
FOR UPDATE 
USING (identifier = COALESCE(auth.jwt() ->> 'email', auth.uid()::text));

CREATE POLICY "rate_limit_delete_expired" 
ON public.rate_limit_tracking 
FOR DELETE 
USING (created_at < now() - INTERVAL '1 hour');

-- Restringir acesso aos game_settings apenas para admins
DROP POLICY IF EXISTS "Users can view game settings" ON public.game_settings;

CREATE POLICY "game_settings_admin_only" 
ON public.game_settings 
FOR SELECT 
USING (public.is_current_user_admin());