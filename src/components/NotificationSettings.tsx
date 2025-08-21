import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, Volume2, VolumeX, Smartphone, Clock, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils';

interface NotificationPermission {
  granted: boolean;
  supported: boolean;
  subscription?: PushSubscription | null;
}

interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  categories: {
    system: boolean;
    budgets: boolean;
    expenses: boolean;
    reports: boolean;
    security: boolean;
  };
}

const defaultPreferences: NotificationPreferences = {
  pushEnabled: false,
  emailEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  categories: {
    system: true,
    budgets: true,
    expenses: true,
    reports: false,
    security: true
  }
};

export const NotificationSettings: React.FC<{
  className?: string;
}> = ({ className }) => {
  const {
    permissionState,
    isSupported,
    hasPermission,
    isSubscribed,
    isLoading,
    userSubscriptions,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);

  // Carregar preferências salvas
  useEffect(() => {
    const savedPreferences = localStorage.getItem('notificationPreferences');
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
      }
    }
  }, []);

  const savePreferences = (newPreferences: NotificationPreferences) => {
    try {
      localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar preferências');
    }
  };

  const handleTestNotification = async () => {
    if (!hasPermission) {
      toast.error('Permissão de notificação não concedida');
      return;
    }

    if (!isSubscribed) {
      // Enviar notificação local se não estiver inscrito em push
      try {
        new Notification('Notificação de Teste', {
          body: 'Esta é uma notificação de teste do sistema!',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'test-notification',
          requireInteraction: false,
          silent: !preferences.soundEnabled
        });
        
        toast.success('Notificação de teste enviada!');
      } catch (error) {
        console.error('Erro ao enviar notificação de teste:', error);
        toast.error('Erro ao enviar notificação de teste');
      }
    } else {
      // Enviar push notification
      await sendTestNotification();
    }
  };

  const togglePushNotifications = async () => {
    if (!hasPermission) {
      await requestPermission();
      return;
    }

    if (preferences.pushEnabled) {
      await unsubscribe();
      const newPreferences = { ...preferences, pushEnabled: false };
      savePreferences(newPreferences);
    } else {
      try {
        await subscribe();
        const newPreferences = { ...preferences, pushEnabled: true };
        savePreferences(newPreferences);
      } catch (error) {
        toast.error('Erro ao ativar notificações push');
      }
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    savePreferences(newPreferences);
  };

  const updateCategoryPreference = (category: keyof NotificationPreferences['categories'], value: boolean) => {
    const newPreferences = {
      ...preferences,
      categories: {
        ...preferences.categories,
        [category]: value
      }
    };
    savePreferences(newPreferences);
  };

  const updateQuietHours = (field: keyof NotificationPreferences['quietHours'], value: any) => {
    const newPreferences = {
      ...preferences,
      quietHours: {
        ...preferences.quietHours,
        [field]: value
      }
    };
    savePreferences(newPreferences);
  };

  // Função helper para converter VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const getPermissionStatus = () => {
    if (!isSupported) {
      return {
        icon: XCircle,
        text: 'Não Suportado',
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        description: 'Seu navegador não suporta notificações'
      };
    }
    
    if (!hasPermission) {
      return {
        icon: AlertCircle,
        text: 'Permissão Necessária',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        description: 'Clique para permitir notificações'
      };
    }
    
    return {
      icon: CheckCircle,
      text: 'Ativo',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      description: 'Notificações estão funcionando'
    };
  };

  const status = getPermissionStatus();

  const permissionStatus = getPermissionStatus();
  const StatusIcon = permissionStatus.icon;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Informações sobre Push Notifications */}
      {hasPermission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Dispositivos Conectados
            </CardTitle>
            <CardDescription>
              Dispositivos que recebem notificações push ({userSubscriptions.length} ativo{userSubscriptions.length !== 1 ? 's' : ''})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userSubscriptions.length > 0 ? (
              userSubscriptions.map((sub, index) => (
                <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        Dispositivo {index + 1}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Conectado em {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      {sub.user_agent && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {sub.user_agent.split(' ')[0]}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={sub.is_active ? 'default' : 'secondary'}>
                    {sub.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum dispositivo conectado</p>
                <p className="text-sm">Ative as notificações push para conectar este dispositivo</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Status das Notificações Push */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações Push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${status.bgColor}`}>
                <status.icon className={`h-4 w-4 ${status.color}`} />
              </div>
              <div>
                <p className="font-medium">Status das Notificações</p>
                <p className="text-sm text-muted-foreground">
                  {status.description}
                </p>
              </div>
            </div>
            
            <Badge variant={hasPermission ? 'default' : 'secondary'}>
              {status.text}
            </Badge>
          </div>
          
          {!isSupported && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Seu navegador não suporta notificações push. Considere atualizar para uma versão mais recente.
              </AlertDescription>
            </Alert>
          )}
          
          {isSupported && !hasPermission && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Para receber notificações mesmo quando não estiver no site, você precisa conceder permissão.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="push-notifications">Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações mesmo quando não estiver no site
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={hasPermission && preferences.pushEnabled}
              onCheckedChange={togglePushNotifications}
              disabled={!isSupported || isLoading}
            />
          </div>
          
          {!hasPermission && isSupported && (
            <Button 
              onClick={requestPermission}
              disabled={isLoading}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Ativar Notificações Push
            </Button>
          )}
          
          {hasPermission && (
            <Button 
              onClick={handleTestNotification}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Enviar Notificação de Teste
            </Button>
          )}
        </CardContent>
      </Card>
      
      {/* Preferências Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Preferências de Notificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="email-notifications">Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receba resumos e alertas importantes por email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) => 
                savePreferences({ ...preferences, emailEnabled: checked })
              }
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <Label htmlFor="sound-notifications">Som das Notificações</Label>
                <p className="text-sm text-muted-foreground">
                  Reproduzir som ao receber notificações
                </p>
              </div>
            </div>
            <Switch
              id="sound-notifications"
              checked={preferences.soundEnabled}
              onCheckedChange={(checked) => 
                savePreferences({ ...preferences, soundEnabled: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <Label htmlFor="vibration-notifications">Vibração (Mobile)</Label>
                <p className="text-sm text-muted-foreground">
                  Vibrar dispositivo ao receber notificações
                </p>
              </div>
            </div>
            <Switch
              id="vibration-notifications"
              checked={preferences.vibrationEnabled}
              onCheckedChange={(checked) => 
                savePreferences({ ...preferences, vibrationEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Horário Silencioso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário Silencioso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="quiet-hours">Ativar Horário Silencioso</Label>
              <p className="text-sm text-muted-foreground">
                Não receber notificações durante determinado período
              </p>
            </div>
            <Switch
              id="quiet-hours"
              checked={preferences.quietHours.enabled}
              onCheckedChange={(checked) => updateQuietHours('enabled', checked)}
            />
          </div>
          
          {preferences.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Início</Label>
                <Select
                  value={preferences.quietHours.start}
                  onValueChange={(value) => updateQuietHours('start', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quiet-end">Fim</Label>
                <Select
                  value={preferences.quietHours.end}
                  onValueChange={(value) => updateQuietHours('end', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Categorias de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Sistema</Label>
              <p className="text-sm text-muted-foreground">
                Atualizações do sistema e manutenção
              </p>
            </div>
            <Switch
              checked={preferences.categories.system}
              onCheckedChange={(checked) => updateCategoryPreference('system', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Orçamentos</Label>
              <p className="text-sm text-muted-foreground">
                Alertas de limite de orçamento e vencimentos
              </p>
            </div>
            <Switch
              checked={preferences.categories.budgets}
              onCheckedChange={(checked) => updateCategoryPreference('budgets', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Despesas</Label>
              <p className="text-sm text-muted-foreground">
                Notificações sobre novas despesas e categorização
              </p>
            </div>
            <Switch
              checked={preferences.categories.expenses}
              onCheckedChange={(checked) => updateCategoryPreference('expenses', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Relatórios</Label>
              <p className="text-sm text-muted-foreground">
                Relatórios mensais e análises financeiras
              </p>
            </div>
            <Switch
              checked={preferences.categories.reports}
              onCheckedChange={(checked) => updateCategoryPreference('reports', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Segurança</Label>
              <p className="text-sm text-muted-foreground">
                Alertas de segurança e login
              </p>
            </div>
            <Switch
              checked={preferences.categories.security}
              onCheckedChange={(checked) => updateCategoryPreference('security', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;