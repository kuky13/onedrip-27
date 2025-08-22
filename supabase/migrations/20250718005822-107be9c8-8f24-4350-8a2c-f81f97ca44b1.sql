-- Criar tabela para configurações do jogo
CREATE TABLE IF NOT EXISTS public.game_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  speed_bug_spawn_rate numeric NOT NULL DEFAULT 0.02,
  speed_bug_speed_multiplier numeric NOT NULL DEFAULT 2.0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO public.game_settings (speed_bug_spawn_rate, speed_bug_speed_multiplier) 
VALUES (0.02, 2.0)
ON CONFLICT DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage game settings" 
ON public.game_settings 
FOR ALL 
USING (is_current_user_admin());

CREATE POLICY "Users can view game settings" 
ON public.game_settings 
FOR SELECT 
USING (true);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_game_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
CREATE TRIGGER update_game_settings_updated_at
  BEFORE UPDATE ON public.game_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_game_settings_updated_at();