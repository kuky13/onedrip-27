import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Share, Plus } from 'lucide-react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { usePWAConfig } from '@/hooks/useAppConfig';
import { useLocation } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const PWAInstallPrompt: React.FC = () => {
  const { isDesktop } = useDeviceDetection();
  const { installTitle, installDescription } = usePWAConfig();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const device = useDeviceDetection();
  const location = useLocation();

  useEffect(() => {
    // Verificar se usuário já recusou a instalação permanentemente
    const isDismissedPermanently = localStorage.getItem('pwa-install-dismissed') === 'true';
    if (isDismissedPermanently) {
      return;
    }

    // Verificar se já está instalado
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstalled();

    // Listener para o evento beforeinstallprompt (Chrome/Android)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Mostrar prompt após 3 segundos se não estiver instalado
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    // Listener para detectar quando o app foi instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA foi instalado!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Para iOS, mostrar instrução após algum tempo
    if (device.isIOS && !device.isStandalone) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      
      // Mostrar novamente a cada 30 minutos
      const intervalTimer = setInterval(() => {
        if (!sessionStorage.getItem('pwa-prompt-dismissed')) {
          setShowPrompt(true);
        }
      }, 30 * 60 * 1000); // 30 minutos

      return () => {
        clearTimeout(timer);
        clearInterval(intervalTimer);
      };
    }

    // Para Chrome/Android, mostrar novamente periodicamente
    if (deferredPrompt) {
      const intervalTimer = setInterval(() => {
        const lastDismissed = sessionStorage.getItem('pwa-prompt-last-dismissed');
        const now = Date.now();
        
        // Mostrar novamente após 1 hora se foi dispensado
        if (!lastDismissed || (now - parseInt(lastDismissed)) > 60 * 60 * 1000) {
          setShowPrompt(true);
        }
      }, 15 * 60 * 1000); // Verificar a cada 15 minutos

      return () => clearInterval(intervalTimer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [device.isIOS, device.isStandalone, isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Usuário aceitou a instalação');
      } else {
        console.log('Usuário rejeitou a instalação');
      }
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    } finally {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Salvar no localStorage que o usuário não quer instalar (permanente)
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Verificar se usuário recusou permanentemente
  const isDismissedPermanently = localStorage.getItem('pwa-install-dismissed') === 'true';
  
  // Verificar se está na página de compartilhamento
  const isSharePage = location.pathname.includes('/share/service-order/');
  
  // Não mostrar se já estiver instalado, recusado permanentemente ou na página de compartilhamento
  if (isInstalled || !showPrompt || isDismissedPermanently || isSharePage) {
    return null;
  }

  // Componente para iOS
  const IOSInstallInstructions = () => (
    <Card className="fixed bottom-4 left-4 right-4 z-50 border-primary shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h3 className="font-semibold text-foreground mb-2">
              {installTitle}
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>{installDescription}</p>
              <div className="flex items-center gap-2">
                <Share className="h-4 w-4" />
                <span>1. Toque no botão compartilhar</span>
              </div>
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>2. Selecione "Adicionar à Tela Inicial"</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Componente para Chrome/Android
  const AndroidInstallPrompt = () => (
    <Card className="fixed bottom-4 left-4 right-4 z-50 border-primary shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {installTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                {installDescription}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
            >
              Não
            </Button>
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Instalar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Renderizar baseado na plataforma
  if (device.isIOS) {
    return <IOSInstallInstructions />;
  }

  // Não mostrar em dispositivos desktop
  if (isDesktop) {
    return null;
  }

  return <AndroidInstallPrompt />;
};

export default PWAInstallPrompt;