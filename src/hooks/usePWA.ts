import { useState, useEffect } from 'react';
import { useDeviceDetection } from './useDeviceDetection';
import { APP_CONFIG } from '@/config/app';

interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  platform: 'web' | 'ios' | 'android' | 'standalone';
}

interface PWAActions {
  installApp: () => Promise<boolean>;
  updateApp: () => Promise<void>;
  shareApp: () => Promise<boolean>;
  refreshApp: () => void;
}

export const usePWA = (): PWAState & PWAActions => {
  const device = useDeviceDetection();
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isInstallable: false,
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
    platform: 'web'
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Detectar plataforma
    const detectPlatform = (): PWAState['platform'] => {
      if (device.isStandalone) return 'standalone';
      if (device.isIOS) return 'ios';
      if (device.isAndroid) return 'android';
      return 'web';
    };

    // Verificar se está instalado
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone;
      return isStandalone || isIOSStandalone;
    };

    // Atualizar estado inicial
    setState(prev => ({
      ...prev,
      isInstalled: checkInstalled(),
      platform: detectPlatform()
    }));

    // Event listeners
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        platform: 'standalone'
      }));
      setDeferredPrompt(null);
    };

    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    // Service Worker para updates
    const handleSWUpdate = () => {
      setState(prev => ({ ...prev, isUpdateAvailable: true }));
    };

    // Adicionar listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service Worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registrado:', registration);
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  handleSWUpdate();
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('Erro no registro do SW:', error);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [device]);

  // Actions
  const installApp = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setState(prev => ({ ...prev, isInstallable: false }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro na instalação:', error);
      return false;
    }
  };

  const updateApp = async (): Promise<void> => {
    if (!navigator.serviceWorker.controller) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Navegar para home após update
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.href = '/';
        });
      }
    } catch (error) {
      console.error('Erro na atualização:', error);
    }
  };

  const shareApp = async (): Promise<boolean> => {
    const shareData = {
      title: APP_CONFIG.pwa.shareTitle,
      text: APP_CONFIG.pwa.shareText,
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return true;
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        // Mostrar toast de copiado
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      return false;
    }
  };

  const refreshApp = (): void => {
    window.location.href = '/';
  };

  return {
    ...state,
    installApp,
    updateApp,
    shareApp,
    refreshApp
  };
};