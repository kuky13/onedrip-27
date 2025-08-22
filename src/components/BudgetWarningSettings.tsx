
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { Bell, Save } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const BudgetWarningSettings = () => {
  const { user, profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [isEnabled, setIsEnabled] = useState(true);
  const [days, setDays] = useState('');

  useEffect(() => {
    if (profile) {
      setIsEnabled(profile.budget_warning_enabled ?? true);
      const warningDays = profile.budget_warning_days ?? 15;
      setDays(warningDays.toString());
    }
  }, [profile]);

  const updateWarningSettingsMutation = useMutation({
    mutationFn: async (settings: { budget_warning_enabled: boolean; budget_warning_days: number }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          budget_warning_enabled: settings.budget_warning_enabled,
          budget_warning_days: settings.budget_warning_days,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      showSuccess({
        title: 'Configurações salvas',
        description: 'Suas preferências de aviso foram atualizadas.',
      });
    },
    onError: (error) => {
      console.error('Error updating warning settings:', error);
      showError({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar suas configurações.',
      });
    },
  });

  const handleSave = () => {
    const numericDays = parseInt(days) || 15;
    if (isNaN(numericDays) || numericDays < 1 || numericDays > 365) {
      showError({
        title: 'Valor inválido',
        description: 'O número de dias deve ser entre 1 e 365.',
      });
      return;
    }
    updateWarningSettingsMutation.mutate({ 
      budget_warning_enabled: isEnabled, 
      budget_warning_days: numericDays 
    });
  };

  return (
    <Card className="glass-card animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Bell className="h-5 w-5 mr-2 text-primary" />
          Aviso de Orçamentos Antigos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="warning-enabled" className="flex flex-col space-y-1">
            <span>Ativar avisos</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Exibir um alerta para orçamentos antigos.
            </span>
          </Label>
          <Switch
            id="warning-enabled"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>
        
        {isEnabled && (
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="warning-days">Avisar após (dias)</Label>
            <Input
              id="warning-days"
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="15"
              min="1"
              max="365"
            />
            <p className="text-xs text-muted-foreground">
              Defina o nº de dias para um orçamento ser "antigo".
            </p>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={updateWarningSettingsMutation.isPending}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateWarningSettingsMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </CardContent>
    </Card>
  );
};
