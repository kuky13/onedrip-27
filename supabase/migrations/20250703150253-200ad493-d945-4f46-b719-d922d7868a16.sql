-- Adicionar política RLS de UPDATE para budget_deletion_audit
-- Esta política permite que usuários atualizem seus próprios registros de auditoria
-- e administradores atualizem qualquer registro

CREATE POLICY "Users can update own deletion audit records" 
ON public.budget_deletion_audit
FOR UPDATE 
USING (deleted_by = auth.uid())
WITH CHECK (deleted_by = auth.uid());

CREATE POLICY "Admins can update all deletion audit records" 
ON public.budget_deletion_audit
FOR UPDATE 
USING (check_if_user_is_admin(auth.uid()))
WITH CHECK (check_if_user_is_admin(auth.uid()));