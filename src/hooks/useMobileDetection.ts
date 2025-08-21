import { useEffect, useState } from 'react';

export interface MobileDetection {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTouchDevice: boolean;
}

export const useMobileDetection = (): MobileDetection => {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    isTouchDevice: false
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Detect iOS
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) ||
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      // Detect Android
      const isAndroid = /android/i.test(userAgent);
      
      // Detect mobile devices
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
                       (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
                       window.innerWidth <= 768;
      
      // Detect touch device
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setDetection({
        isMobile,
        isIOS,
        isAndroid,
        isTouchDevice
      });
    };

    detectDevice();

    // Listen for window resize to update mobile detection
    const handleResize = () => {
      detectDevice();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return detection;
};