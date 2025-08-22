import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TestTube, Smartphone, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface UnifiedBetaFeaturesSettingsProps {
  isLite?: boolean;
}

export const UnifiedBetaFeaturesSettings = ({ isLite = false }: UnifiedBetaFeaturesSettingsProps) => {
  const [dashboardLiteEnabled, setDashboardLiteEnabled] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAndroid, shouldUseLite } = useDeviceDetection();

  // Check if user has required role
  const hasPermission = profile?.role === 'admin' || profile?.role === 'user';

  useEffect(() => {
    // Load setting from localStorage
    const enabled = localStorage.getItem('painel-enabled') === 'true';
    setDashboardLiteEnabled(enabled);

    // Auto-enable for Android devices if not already set
    if (isAndroid && !enabled && localStorage.getItem('painel-enabled') === null) {
      setDashboardLiteEnabled(true);
      localStorage.setItem('painel-enabled', 'true');
    }
  }, [isAndroid]);

  const handleDashboardLiteChange = (enabled: boolean) => {
    setDashboardLiteEnabled(enabled);
    localStorage.setItem('painel-enabled', enabled.toString());
    
    const message = enabled 
      ? 'Painel ativado! Redirecionando...' 
      : 'Painel desativado.';
    
    if (isLite) {
      // Simple alert for lite version
      alert(message);
      if (enabled) {
        setTimeout(() => {
          navigate('/painel');
        }, 1000);
      }
    } else {
      // Toast for normal version
      toast({
        title: enabled ? 'Painel Ativado!' : 'Painel Desativado',
        description: message,
      });

      if (enabled) {
        setTimeout(() => {
          navigate('/painel');
        }, 1500);
      }
    }
  };

  if (!hasPermission) {
    return (
      <Card className={isLite ? "" : "glass-card shadow-soft"}>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground text-center">
            Você não tem permissão para acessar funcionalidades beta.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isLite ? "" : "glass-card shadow-soft"}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <TestTube className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <CardTitle className="text-xl">Funcionalidades Beta</CardTitle>
            {!isLite && (
              <CardDescription>
                Experimente recursos em desenvolvimento
              </CardDescription>
            )}
            {isLite && (
              <p className="text-sm text-muted-foreground">
                Recursos em desenvolvimento
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="space-y-1">
            <Label htmlFor="painel-toggle" className="text-base font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Painel Mobile
            </Label>
            <p className="text-sm text-muted-foreground">
              Interface otimizada para dispositivos móveis
            </p>
          </div>
          <div className="flex items-center gap-3">
            {dashboardLiteEnabled && (
              <Badge variant="secondary" className="bg-orange-500/10 text-orange-600">
                Beta
              </Badge>
            )}
            <Switch
              id="painel-toggle"
              checked={dashboardLiteEnabled}
              onCheckedChange={handleDashboardLiteChange}
            />
          </div>
        </div>

        {dashboardLiteEnabled && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="font-medium text-foreground">Recursos do Painel:</h4>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="p-1.5 rounded-md bg-primary/10 mt-0.5">
                  <Smartphone className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm">Interface Mobile</p>
                  <p className="text-xs text-muted-foreground">
                    Navegação otimizada para toque e dispositivos móveis
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="p-1.5 rounded-md bg-primary/10 mt-0.5">
                  <Monitor className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm">Componentes Adaptativos</p>
                  <p className="text-xs text-muted-foreground">
                    Layout que se adapta automaticamente ao tamanho da tela
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-200/50">
              <p className="text-xs text-orange-600">
                ⚠️ Esta é uma funcionalidade em desenvolvimento. Alguns recursos podem apresentar instabilidades.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};