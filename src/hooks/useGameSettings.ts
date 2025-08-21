import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GameSettings {
  id?: string;
  speed_bug_spawn_rate: number;
  speed_bug_speed_multiplier: number;
  bug_spawn_percentage?: number;
  bug_damage?: number;
  hit_sound_enabled?: boolean;
  hit_sound_volume?: number;
  boss_bug_spawn_rate?: number;
  boss_bug_points?: number;
  boss_bug_timer?: number;
  boss_bug_damage?: number;
  created_at?: string;
  updated_at?: string;
}

export const useGameSettings = () => {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      let { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code === 'PGRST116') { // No rows found
        // Insert default settings
        const defaultSettings = {
          speed_bug_spawn_rate: 0.02,
          speed_bug_speed_multiplier: 2.0,
          bug_spawn_percentage: 15.0,
          bug_damage: 10.0,
          hit_sound_enabled: true,
          hit_sound_volume: 0.5,
          boss_bug_spawn_rate: 0.002,
          boss_bug_points: 1000,
          boss_bug_timer: 7000,
          boss_bug_damage: 5
        };

        const { data: insertData, error: insertError } = await supabase
          .from('game_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        data = insertData;
      } else if (error) {
        throw error;
      }

      setSettings(data);
    } catch (err: any) {
      console.error('Erro ao buscar/criar configurações:', err);
      setError(err.message || 'Erro ao carregar configurações do jogo');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<GameSettings>) => {
    try {
      if (!settings?.id) {
        // If still no ID, try to fetch/create first
        await fetchSettings();
        if (!settings?.id) return false;
      }

      const { error } = await supabase
        .from('game_settings')
        .update(newSettings)
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...newSettings } : null);
      toast.success('Configurações salvas com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar configurações:', err);
      toast.error('Erro ao salvar configurações: ' + (err.message || 'Erro desconhecido'));
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refetch: fetchSettings
  };
};