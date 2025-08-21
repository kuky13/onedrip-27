import { useState, useEffect } from 'react';

interface PWACapabilities {
  canInstall: boolean;
  canShare: boolean;
  canNotify: boolean;
  canVibrate: boolean;
  canFullscreen: boolean;
  hasCamera: boolean;
  hasLocation: boolean;
  canUploadFiles: boolean;
  supportsBackgroundSync: boolean;
  supportsPushNotifications: boolean;
}

export const usePWACapabilities = (): PWACapabilities => {
  const [capabilities, setCapabilities] = useState<PWACapabilities>({
    canInstall: false,
    canShare: false,
    canNotify: false,
    canVibrate: false,
    canFullscreen: false,
    hasCamera: false,
    hasLocation: false,
    canUploadFiles: false,
    supportsBackgroundSync: false,
    supportsPushNotifications: false,
  });

  useEffect(() => {
    const checkCapabilities = async () => {
      const newCapabilities: PWACapabilities = {
        // Instalação
        canInstall: 'beforeinstallprompt' in window || 
                   (window.navigator as any).standalone !== undefined,
        
        // Compartilhamento
        canShare: 'share' in navigator,
        
        // Notificações
        canNotify: 'Notification' in window,
        
        // Vibração
        canVibrate: 'vibrate' in navigator,
        
        // Fullscreen
        canFullscreen: document.fullscreenEnabled || 
                      (document as any).webkitFullscreenEnabled ||
                      (document as any).mozFullScreenEnabled ||
                      (document as any).msFullscreenEnabled,
        
        // Câmera
        hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        
        // Localização
        hasLocation: 'geolocation' in navigator,
        
        // Upload de arquivos
        canUploadFiles: 'File' in window && 'FileReader' in window,
        
        // Background Sync
        supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
        
        // Push Notifications
        supportsPushNotifications: 'serviceWorker' in navigator && 'PushManager' in window,
      };

      setCapabilities(newCapabilities);
    };

    checkCapabilities();
  }, []);

  return capabilities;
};

export default usePWACapabilities;