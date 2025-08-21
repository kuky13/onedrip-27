import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Smartphone, Globe, QrCode, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface BetaFeaturesSettingsLiteProps {
  userId: string;
  profile: any;
}
export const BetaFeaturesSettingsLite = ({
  userId,
  profile
}: BetaFeaturesSettingsLiteProps) => {
  const {
    toast
  } = useToast();
  const [dashboardLiteEnabled, setDashboardLiteEnabled] = useState(false);
  const [forceNormalDashboard, setForceNormalDashboard] = useState(false);
  const [extSocialQrEnabled, setExtSocialQrEnabled] = useState(false);

  // Development warning states
  const [showDevWarning, setShowDevWarning] = useState(false);
  const [devWarningTitle, setDevWarningTitle] = useState('Funcionalidade em Desenvolvimento');
  const [devWarningMessage, setDevWarningMessage] = useState('Esta funcionalidade ainda está em desenvolvimento. Em breve estará disponível com melhorias completas.');
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const isAdmin = profile?.role === 'admin';
  const isUser = profile?.role === 'user';
  const canUseBeta = isAdmin || isUser;
  useEffect(() => {
    // Load settings from localStorage
    const liteEnabled = localStorage.getItem('painel-enabled') === 'true';
    const forceNormal = localStorage.getItem('force-normal-dashboard') === 'true';
    const socialQr = localStorage.getItem('ext-social-qr-enabled') === 'true';

    // Detectar Android e ativar automaticamente
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid && localStorage.getItem('painel-enabled') === null) {
      localStorage.setItem('painel-enabled', 'true');
      setDashboardLiteEnabled(true);
    } else {
      setDashboardLiteEnabled(liteEnabled);
    }
    setForceNormalDashboard(forceNormal);
    setExtSocialQrEnabled(socialQr);

    // Load development warning settings if admin
    if (isAdmin) {
      loadDevWarningSettings();
    }
  }, [isAdmin]);
  const loadDevWarningSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const {
        data,
        error
      } = await supabase.from('site_settings').select('show_dev_warning, dev_warning_title, dev_warning_message').maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading dev warning settings:', error);
        return;
      }
      if (data) {
        setShowDevWarning(data.show_dev_warning || false);
        setDevWarningTitle(data.dev_warning_title || 'Funcionalidade em Desenvolvimento');
        setDevWarningMessage(data.dev_warning_message || 'Esta funcionalidade ainda está em desenvolvimento. Em breve estará disponível com melhorias completas.');
      }
    } catch (error) {
      console.error('Error loading dev warning settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };
  const handleDashboardLiteChange = (enabled: boolean) => {
    setDashboardLiteEnabled(enabled);
    localStorage.setItem('painel-enabled', enabled.toString());
    alert(enabled ? 'Painel ativado! Você será redirecionado para o Painel na próxima vez que acessar o dashboard.' : 'Painel desativado. Você voltará a usar a versão normal do dashboard.');
    if (enabled) {
      setTimeout(() => {
        window.location.href = '/painel';
      }, 1000);
    }
  };
  const handleForceNormalDashboard = (enabled: boolean) => {
    setForceNormalDashboard(enabled);
    localStorage.setItem('force-normal-dashboard', enabled.toString());
    if (enabled) {
      alert('Forçar Dashboard Normal ativado! Você será redirecionado para a versão normal.');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } else {
      alert('Forçar Dashboard Normal desativado.');
    }
  };
  const handleExtSocialQrChange = (enabled: boolean) => {
    setExtSocialQrEnabled(enabled);
    localStorage.setItem('ext-social-qr-enabled', enabled.toString());
    alert(enabled ? 'Ext-Social QR ativado! Agora você pode compartilhar links de orçamentos diretamente para redes sociais.' : 'Ext-Social QR desativado.');
  };
  const updateDevWarningSetting = async (field: string, value: any) => {
    try {
      setIsLoadingSettings(true);
      const {
        error
      } = await supabase.from('site_settings').update({
        [field]: value
      }).maybeSingle();
      if (error) {
        console.error('Error updating dev warning setting:', error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar a configuração.",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "Configuração salva",
        description: "A configuração foi atualizada com sucesso."
      });
    } catch (error) {
      console.error('Error updating dev warning setting:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };
  const handleDevWarningToggle = (enabled: boolean) => {
    setShowDevWarning(enabled);
    updateDevWarningSetting('show_dev_warning', enabled);
  };
  const handleDevWarningTitleChange = (title: string) => {
    setDevWarningTitle(title);
    // Debounce the save
    setTimeout(() => {
      updateDevWarningSetting('dev_warning_title', title);
    }, 1000);
  };
  const handleDevWarningMessageChange = (message: string) => {
    setDevWarningMessage(message);
    // Debounce the save
    setTimeout(() => {
      updateDevWarningSetting('dev_warning_message', message);
    }, 1000);
  };
  return <Card>
      <CardHeader>
        <CardTitle>Funcionalidades Beta</CardTitle>
        <p className="text-sm text-muted-foreground">
          Recursos experimentais em desenvolvimento
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Painel */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Painel</p>
              <p className="text-xs text-muted-foreground">
                Interface otimizada para dispositivos móveis (idêntica ao iOS Safari)
              </p>
            </div>
          </div>
          <Switch checked={dashboardLiteEnabled} onCheckedChange={handleDashboardLiteChange} />
        </div>

        {/* Force Normal Dashboard (Admin only) */}
        {isAdmin && <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Forçar Dashboard Normal</p>
                <p className="text-xs text-muted-foreground">
                  Ignorar detecção de iPhone e usar dashboard completo
                </p>
              </div>
            </div>
            <Switch checked={forceNormalDashboard} onCheckedChange={handleForceNormalDashboard} />
          </div>}

        {/* Development Warning (Admin only) */}
        {isAdmin}

        {dashboardLiteEnabled && <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Painel:</strong> Versão otimizada para dispositivos móveis, 
              com interface simplificada e melhor performance em telas menores.
            </p>
          </div>}
      </CardContent>
    </Card>;
};