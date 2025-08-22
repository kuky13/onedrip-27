import { useState, useEffect } from 'react';

interface DeviceInfo {
  isDesktop: boolean;
  isMobile: boolean;
  isTablet: boolean;
  platform: 'desktop' | 'mobile' | 'tablet';
  isTouch: boolean;
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  shouldUseLite: boolean;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isDesktop: false,
    isMobile: false,
    isTablet: false,
    platform: 'desktop',
    isTouch: false,
    screenSize: 'medium',
    isIOS: false,
    isAndroid: false,
    isStandalone: false,
    shouldUseLite: false
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const screenWidth = window.innerWidth;
      
      // Detectar se é dispositivo touch
      const isTouch = 'ontouchstart' in window || 
                     navigator.maxTouchPoints > 0 || 
                     (navigator as any).msMaxTouchPoints > 0;

      // Detectar sistema operacional específico
      const isIOS = /ipad|iphone|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);

      // Detectar se está rodando como PWA standalone
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');

      // Detectar tipo de dispositivo baseado na largura da tela e user agent
      const isMobileDevice = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTabletDevice = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
      
      // Considerações adicionais baseadas no tamanho da tela
      const isMobileScreen = screenWidth < 768;
      const isTabletScreen = screenWidth >= 768 && screenWidth < 1024;
      const isDesktopScreen = screenWidth >= 1024;

      // Lógica combinada para determinar o tipo de dispositivo
      let isDesktop = false;
      let isMobile = false;
      let isTablet = false;
      let platform: 'desktop' | 'mobile' | 'tablet' = 'desktop';

      if (isMobileDevice || (isMobileScreen && isTouch)) {
        isMobile = true;
        platform = 'mobile';
      } else if (isTabletDevice || (isTabletScreen && isTouch)) {
        isTablet = true;
        platform = 'tablet';
      } else if (isDesktopScreen && !isTouch) {
        isDesktop = true;
        platform = 'desktop';
      } else {
        // Fallback: usar apenas o tamanho da tela
        if (isMobileScreen) {
          isMobile = true;
          platform = 'mobile';
        } else if (isTabletScreen) {
          isTablet = true;
          platform = 'tablet';
        } else {
          isDesktop = true;
          platform = 'desktop';
        }
      }

      // Determinar tamanho da tela
      let screenSize: 'small' | 'medium' | 'large' | 'xlarge' = 'medium';
      if (screenWidth < 640) {
        screenSize = 'small';
      } else if (screenWidth < 1024) {
        screenSize = 'medium';
      } else if (screenWidth < 1280) {
        screenSize = 'large';
      } else {
        screenSize = 'xlarge';
      }

      // Determinar se deve usar versão lite (para dispositivos móveis)
      const shouldUseLite = isMobile || isTablet || 
                           localStorage.getItem('painel-enabled') === 'true';

      setDeviceInfo({
        isDesktop,
        isMobile,
        isTablet,
        platform,
        isTouch,
        screenSize,
        isIOS,
        isAndroid,
        isStandalone,
        shouldUseLite
      });
    };

    // Detectar na inicialização
    detectDevice();

    // Detectar quando a tela for redimensionada
    const handleResize = () => {
      detectDevice();
    };

    window.addEventListener('resize', handleResize);
    
    // Detectar mudanças na orientação (dispositivos móveis)
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
};