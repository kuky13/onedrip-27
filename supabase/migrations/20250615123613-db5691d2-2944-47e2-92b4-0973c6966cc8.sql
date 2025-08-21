
-- Adiciona colunas para controlar os avisos de orçamentos antigos
ALTER TABLE public.user_profiles
ADD COLUMN budget_warning_days INTEGER NOT NULL DEFAULT 15,
ADD COLUMN budget_warning_enabled BOOLEAN NOT NULL DEFAULT TRUE;
