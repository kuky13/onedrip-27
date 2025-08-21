-- Verificar e corrigir permissões para user_notifications_read

-- Verificar permissões atuais
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'user_notifications_read' 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Garantir permissões corretas para a tabela user_notifications_read
GRANT SELECT ON public.user_notifications_read TO anon;
GRANT ALL PRIVILEGES ON public.user_notifications_read TO authenticated;

-- Verificar se a função mark_notification_as_read tem permissões corretas
GRANT EXECUTE ON FUNCTION mark_notification_as_read(UUID) TO authenticated;

-- Verificar se as políticas RLS estão ativas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'user_notifications_read';

-- Recriar políticas RLS se necessário
DROP POLICY IF EXISTS "Users can manage their own read status" ON public.user_notifications_read;
DROP POLICY IF EXISTS "Admins can view all read status" ON public.user_notifications_read;

CREATE POLICY "Users can manage their own read status" ON public.user_notifications_read
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all read status" ON public.user_notifications_read
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Comentário
COMMENT ON TABLE public.user_notifications_read IS 'Tabela para rastrear quais notificações foram lidas por cada usuário - permissões verificadas';