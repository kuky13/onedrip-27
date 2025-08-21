-- Adicionar coluna user_deleted_at à tabela user_notifications para soft delete
ALTER TABLE public.user_notifications 
ADD COLUMN user_deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN public.user_notifications.user_deleted_at IS 'Timestamp quando o usuário deletou a notificação (soft delete)';

-- Criar índice para melhorar performance nas consultas de filtragem
CREATE INDEX idx_user_notifications_user_deleted_at 
ON public.user_notifications(user_deleted_at) 
WHERE user_deleted_at IS NOT NULL;

-- Criar índice composto para consultas por usuário e status de exclusão
CREATE INDEX idx_user_notifications_user_id_deleted_at 
ON public.user_notifications(user_id, user_deleted_at);