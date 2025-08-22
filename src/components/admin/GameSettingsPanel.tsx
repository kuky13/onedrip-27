import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Settings, Gamepad2, AlertTriangle, Save, Volume2, Bug } from 'lucide-react';
import { useGameSettings } from '@/hooks/useGameSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
export const GameSettingsPanel: React.FC = () => {
  const {
    settings,
    isLoading,
    updateSettings
  } = useGameSettings();
  const [formData, setFormData] = useState({
    speed_bug_spawn_rate: settings?.speed_bug_spawn_rate || 0.02,
    speed_bug_speed_multiplier: settings?.speed_bug_speed_multiplier || 2.0,
    bug_spawn_percentage: settings?.bug_spawn_percentage || 15.0,
    bug_damage: settings?.bug_damage || 10.0,
    hit_sound_enabled: settings?.hit_sound_enabled ?? true,
    hit_sound_volume: settings?.hit_sound_volume || 0.5,
    boss_bug_spawn_rate: settings?.boss_bug_spawn_rate || 0.002,
    boss_bug_points: settings?.boss_bug_points || 1000,
    boss_bug_timer: settings?.boss_bug_timer || 7000,
    boss_bug_damage: settings?.boss_bug_damage || 5
  });
  const [isSaving, setIsSaving] = useState(false);
  React.useEffect(() => {
    if (settings) {
      setFormData({
        speed_bug_spawn_rate: settings.speed_bug_spawn_rate,
        speed_bug_speed_multiplier: settings.speed_bug_speed_multiplier,
        bug_spawn_percentage: settings.bug_spawn_percentage || 15.0,
        bug_damage: settings.bug_damage || 10.0,
        hit_sound_enabled: settings.hit_sound_enabled !== undefined ? settings.hit_sound_enabled : true,
        hit_sound_volume: settings.hit_sound_volume || 0.5,
        boss_bug_spawn_rate: settings.boss_bug_spawn_rate || 0.002,
        boss_bug_points: settings.boss_bug_points || 1000,
        boss_bug_timer: settings.boss_bug_timer || 7000,
        boss_bug_damage: settings.boss_bug_damage || 5
      });
    }
  }, [settings]);
  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validações - não permite campos vazios ou valores inválidos
      if (!formData.speed_bug_spawn_rate && formData.speed_bug_spawn_rate !== 0) {
        toast.error('Taxa de spawn é obrigatória');
        return;
      }
      if (!formData.speed_bug_speed_multiplier) {
        toast.error('Multiplicador de velocidade é obrigatório');
        return;
      }
      if (!formData.bug_spawn_percentage && formData.bug_spawn_percentage !== 0) {
        toast.error('Porcentagem de aparição é obrigatória');
        return;
      }
      if (!formData.bug_damage) {
        toast.error('Dano dos bugs é obrigatório');
        return;
      }
      if (formData.speed_bug_spawn_rate < 0 || formData.speed_bug_spawn_rate > 1) {
        toast.error('Taxa de spawn deve estar entre 0 e 1');
        return;
      }
      if (formData.speed_bug_speed_multiplier < 1 || formData.speed_bug_speed_multiplier > 10) {
        toast.error('Multiplicador de velocidade deve estar entre 1 e 10');
        return;
      }
      if (formData.bug_spawn_percentage < 0 || formData.bug_spawn_percentage > 100) {
        toast.error('Porcentagem de aparição deve estar entre 0 e 100');
        return;
      }
      if (formData.bug_damage < 1) {
        toast.error('Dano dos bugs deve ser maior que 0');
        return;
      }
      if (formData.hit_sound_volume < 0 || formData.hit_sound_volume > 1) {
        toast.error('Volume do som deve estar entre 0 e 1');
        return;
      }
      const success = await updateSettings(formData);
      if (success) {
        toast.success('Configurações salvas com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5" />
            Configurações do Jogo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5" />
          Configurações do Jogo - Caçador de Bugs
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure as mecânicas especiais do jogo de caçar bugs
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bug Especial 🐛 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="text-lg font-semibold">Apple BUG 🐛</h3>
          </div>
          
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              ⚠️ <strong>Regra Especial:</strong> Se este bug passar pela tela, <strong>toda a pontuação anterior do jogador será deletada</strong> permanentemente!
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Este bug aparece com emoji 🐛 e se move muito rapidamente, mas ainda é possível de capturar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spawn-rate">
                Taxa de Spawn (%)
                <span className="text-xs text-muted-foreground ml-2">
                  (Digite diretamente em %)
                </span>
              </Label>
              <Input id="spawn-rate" type="number" min="0" max="100" step="0.1" value={(formData.speed_bug_spawn_rate * 100).toFixed(1)} onChange={e => {
              const value = e.target.value;
              if (value === '') return; // Não permite campo vazio
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                setFormData(prev => ({
                  ...prev,
                  speed_bug_spawn_rate: numValue / 100
                }));
              }
            }} onBlur={e => {
              // Se o campo estiver vazio ao sair, define valor padrão
              if (e.target.value === '') {
                setFormData(prev => ({
                  ...prev,
                  speed_bug_spawn_rate: 0.02
                }));
              }
            }} />
              <p className="text-xs text-muted-foreground">
                Atual: {(formData.speed_bug_spawn_rate * 100).toFixed(1)}% de chance por spawn
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="speed-multiplier">
                Multiplicador de Velocidade
                <span className="text-xs text-muted-foreground ml-2">
                  (2.0 = 2x mais rápido)
                </span>
              </Label>
              <Input id="speed-multiplier" type="number" min="1" max="10" step="0.1" value={formData.speed_bug_speed_multiplier} onChange={e => {
              const value = e.target.value;
              if (value === '') return; // Não permite campo vazio
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                setFormData(prev => ({
                  ...prev,
                  speed_bug_speed_multiplier: numValue
                }));
              }
            }} onBlur={e => {
              // Se o campo estiver vazio ao sair, define valor padrão
              if (e.target.value === '') {
                setFormData(prev => ({
                  ...prev,
                  speed_bug_speed_multiplier: 2.0
                }));
              }
            }} />
              <p className="text-xs text-muted-foreground">
                Atual: {formData.speed_bug_speed_multiplier}x a velocidade normal
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Configurações de Bugs Gerais */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-orange-500" />
            <h3 className="text-lg font-semibold">Configurações Gerais dos Bugs</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bug-percentage">
                Porcentagem de Aparição de Bugs Especiais (%)
              </Label>
              <Input id="bug-percentage" type="number" step="0.1" min="0" max="100" value={formData.bug_spawn_percentage} onChange={e => {
              const value = e.target.value;
              if (value === '') return; // Não permite campo vazio
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                setFormData(prev => ({
                  ...prev,
                  bug_spawn_percentage: numValue
                }));
              }
            }} onBlur={e => {
              // Se o campo estiver vazio ao sair, define valor padrão
              if (e.target.value === '') {
                setFormData(prev => ({
                  ...prev,
                  bug_spawn_percentage: 15.0
                }));
              }
            }} />
              <p className="text-xs text-muted-foreground">
                Chance de aparecer bugs especiais no jogo
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bug-damage">Dano dos Bugs</Label>
              <Input id="bug-damage" type="number" step="1" min="1" max="100" value={formData.bug_damage} onChange={e => {
              const value = e.target.value;
              if (value === '') return; // Não permite campo vazio
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                setFormData(prev => ({
                  ...prev,
                  bug_damage: numValue
                }));
              }
            }} onBlur={e => {
              // Se o campo estiver vazio ao sair, define valor padrão
              if (e.target.value === '') {
                setFormData(prev => ({
                  ...prev,
                  bug_damage: 10.0
                }));
              }
            }} />
              <p className="text-xs text-muted-foreground">
                Dano causado pelos bugs ao jogador
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Configurações de Boss Bug */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-purple-500" />
            <h3 className="text-lg font-semibold">Configurações de Bugs de shock</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="boss-spawn-rate">
                Taxa de Spawn (%)
                <span className="text-xs text-muted-foreground ml-2">
                  (Digite diretamente em %)
                </span>
              </Label>
              <Input id="boss-spawn-rate" type="number" min="0" max="100" step="0.1" value={(formData.boss_bug_spawn_rate * 100).toFixed(1)} onChange={e => {
              const value = e.target.value;
              if (value === '') return;
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                setFormData(prev => ({
                  ...prev,
                  boss_bug_spawn_rate: numValue / 100
                }));
              }
            }} onBlur={e => {
              if (e.target.value === '') {
                setFormData(prev => ({
                  ...prev,
                  boss_bug_spawn_rate: 0.002
                }));
              }
            }} />
              <p className="text-xs text-muted-foreground">
                Atual: {(formData.boss_bug_spawn_rate * 100).toFixed(1)}% de chance por spawn
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="boss-points">Pontos por Eliminação</Label>
              <Input id="boss-points" type="number" min="1" value={formData.boss_bug_points} onChange={e => {
              const value = e.target.value;
              if (value === '') return;
              const numValue = parseInt(value);
              if (!isNaN(numValue)) {
                setFormData(prev => ({
                  ...prev,
                  boss_bug_points: numValue
                }));
              }
            }} onBlur={e => {
              if (e.target.value === '') {
                setFormData(prev => ({
                  ...prev,
                  boss_bug_points: 1000
                }));
              }
            }} />
              <p className="text-xs text-muted-foreground">
                Pontos ganhos ao eliminar um boss
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="boss-timer">Tempo para Eliminar (segundos)</Label>
              <Input id="boss-timer" type="number" min="1" value={Math.round(formData.boss_bug_timer / 1000)} onChange={e => {
              const value = e.target.value;
              if (value === '') return;
              const numValue = parseInt(value);
              if (!isNaN(numValue)) {
                setFormData(prev => ({
                  ...prev,
                  boss_bug_timer: numValue * 1000
                }));
              }
            }} onBlur={e => {
              if (e.target.value === '') {
                setFormData(prev => ({
                  ...prev,
                  boss_bug_timer: 7000
                }));
              }
            }} />
              <p className="text-xs text-muted-foreground">
                Tempo em segundos antes do boss causar dano
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="boss-damage">Dano se não Eliminado</Label>
              <Input id="boss-damage" type="number" min="1" value={formData.boss_bug_damage} onChange={e => {
              const value = e.target.value;
              if (value === '') return;
              const numValue = parseInt(value);
              if (!isNaN(numValue)) {
                setFormData(prev => ({
                  ...prev,
                  boss_bug_damage: numValue
                }));
              }
            }} onBlur={e => {
              if (e.target.value === '') {
                setFormData(prev => ({
                  ...prev,
                  boss_bug_damage: 5
                }));
              }
            }} />
              <p className="text-xs text-muted-foreground">
                Vidas perdidas se o boss não for eliminado a tempo
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Configurações de Som */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-green-500" />
            <h3 className="text-lg font-semibold">Configurações de Som</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-enabled">Som de Acerto Habilitado</Label>
                <p className="text-xs text-muted-foreground">
                  Ativar ou desativar o som quando acertar um bug
                </p>
              </div>
              <Switch id="sound-enabled" checked={formData.hit_sound_enabled} onCheckedChange={checked => setFormData(prev => ({
              ...prev,
              hit_sound_enabled: checked
            }))} />
            </div>

            {formData.hit_sound_enabled && <div className="space-y-2">
                <Label htmlFor="sound-volume">Volume do Som de Acerto</Label>
                <div className="px-3">
                  <Slider id="sound-volume" min={0} max={1} step={0.1} value={[formData.hit_sound_volume]} onValueChange={value => setFormData(prev => ({
                ...prev,
                hit_sound_volume: value[0]
              }))} className="w-full" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Silencioso</span>
                  <span>{Math.round(formData.hit_sound_volume * 100)}%</span>
                  <span>Alto</span>
                </div>
              </div>}
          </div>
        </div>

        <Separator />

        {/* Informações adicionais */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
            📊 Como funciona:
          </h4>
          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            <li>• Bug 🐛 aparece com a taxa configurada a cada spawn</li>
            <li>• Velocidade = velocidade normal × multiplicador</li>
            <li>• Se capturado: +200 pontos</li>
            <li>• Se escapar: deleta TODA pontuação anterior do jogador</li>
            <li>• Aparece com animação especial (vermelho pulsante)</li>
            <li>• Som de acerto pode ser configurado ou desabilitado</li>
            <li>• Bugs especiais podem causar dano configurável</li>
          </ul>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </CardContent>
    </Card>;
};