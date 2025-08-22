-- Testar função soft_delete_service_order
-- Date: 2025-01-20
-- Description: Verificar se a função soft_delete_service_order está funcionando corretamente

-- Verificar se a função existe
SELECT routine_name, routine_type, routine_definition 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'soft_delete_service_order';

-- Verificar se a função is_current_user_admin existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'is_current_user_admin';

-- Criar função is_current_user_admin se não existir
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Verificar permissões da função
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO anon;

-- Verificar permissões da função soft_delete_service_order
GRANT EXECUTE ON FUNCTION public.soft_delete_service_order(UUID) TO authenticated;

-- Comentário
COMMENT ON FUNCTION public.is_current_user_admin IS 'Verifica se o usuário atual é administrador';
COMMENT ON FUNCTION public.soft_delete_service_order IS 'Função para soft delete de ordens de serviço';