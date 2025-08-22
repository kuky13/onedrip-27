-- Adicionar novas configurações do jogo
ALTER TABLE public.game_settings 
ADD COLUMN IF NOT EXISTS bug_spawn_percentage numeric DEFAULT 15.0,
ADD COLUMN IF NOT EXISTS bug_damage numeric DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS hit_sound_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS hit_sound_volume numeric DEFAULT 0.5;

-- Comentários para documentar as novas colunas
COMMENT ON COLUMN public.game_settings.bug_spawn_percentage IS 'Porcentagem de chance de aparecer bugs especiais';
COMMENT ON COLUMN public.game_settings.bug_damage IS 'Dano causado pelos bugs';
COMMENT ON COLUMN public.game_settings.hit_sound_enabled IS 'Se o som de acerto está habilitado';
COMMENT ON COLUMN public.game_settings.hit_sound_volume IS 'Volume do som de acerto (0.0 a 1.0)';

-- Inserir configurações padrão se não existir nenhuma
INSERT INTO public.game_settings (
  speed_bug_spawn_rate, 
  speed_bug_speed_multiplier, 
  bug_spawn_percentage, 
  bug_damage, 
  hit_sound_enabled, 
  hit_sound_volume
)
SELECT 0.02, 2.0, 15.0, 10.0, true, 0.5
WHERE NOT EXISTS (SELECT 1 FROM public.game_settings);