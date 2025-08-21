-- Adicionar user_id à tabela clients para tornar clientes únicos por usuário
ALTER TABLE public.clients ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Atualizar registros existentes com um usuário padrão (se houver)
-- Nota: Esta é uma migração de segurança - clientes existentes serão orfãos até serem associados

-- Criar nova política RLS para clientes serem únicos por usuário
DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_update_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON public.clients;

-- Novas políticas RLS para clientes por usuário
CREATE POLICY "users_can_view_own_clients" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_own_clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_clients" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_clients" ON public.clients
  FOR DELETE USING (auth.uid() = user_id);

-- Admins podem gerenciar todos os clientes
CREATE POLICY "admins_can_manage_all_clients" ON public.clients
  FOR ALL USING (is_current_user_admin());

-- Criar função para garantir que user_id seja sempre preenchido
CREATE OR REPLACE FUNCTION public.ensure_client_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para automaticamente definir user_id
CREATE TRIGGER ensure_client_user_id_trigger
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.ensure_client_user_id();