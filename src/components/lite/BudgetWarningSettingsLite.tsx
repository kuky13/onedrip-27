import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Save } from 'lucide-react';

interface BudgetWarningSettingsLiteProps {
  userId: string;
  profile: any;
}

export const BudgetWarningSettingsLite = ({ userId, profile }: BudgetWarningSettingsLiteProps) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [days, setDays] = useState('15');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setIsEnabled(profile.budget_warning_enabled ?? true);
      const warningDays = profile.budget_warning_days ?? 15;
      setDays(warningDays.toString());
    }
  }, [profile]);

  const handleSave = async () => {
    const numericDays = parseInt(days) || 15;
    if (isNaN(numericDays) || numericDays < 1 || numericDays > 365) {
      alert('O número de dias deve ser entre 1 e 365.');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          budget_warning_enabled: isEnabled,
          budget_warning_days: numericDays,
        })
        .eq('id', userId);

      if (error) throw error;

      alert('Configurações de aviso salvas com sucesso!');
    } catch (error) {
      console.error('Error updating warning settings:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Bell className="h-5 w-5 mr-2 text-primary" />
          Aviso de Orçamentos Antigos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-foreground">Ativar avisos</p>
            <p className="text-xs text-muted-foreground">
              Exibir um alerta para orçamentos antigos
            </p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>

        {isEnabled && (
          <div className="space-y-2">
            <Label htmlFor="warning-days">Avisar após (dias)</Label>
            <Input
              id="warning-days"
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="15"
              min="1"
              max="365"
              inputMode="numeric"
            />
            <p className="text-xs text-muted-foreground">
              Defina o nº de dias para um orçamento ser "antigo".
            </p>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          size="lg"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </CardContent>
    </Card>
  );
};