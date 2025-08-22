import { useEffect, useState } from 'react';

export interface IOSOptimizations {
  isIOS: boolean;
  isStandalone: boolean;
  viewportHeight: string;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const useIOSOptimization = (): IOSOptimizations => {
  const [optimizations, setOptimizations] = useState<IOSOptimizations>({
    isIOS: false,
    isStandalone: false,
    viewportHeight: '100vh',
    safeAreaInsets: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  });

  useEffect(() => {
    const detectIOS = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };

    const isStandalone = () => {
      return (window.navigator as any).standalone || 
             window.matchMedia('(display-mode: standalone)').matches;
    };

    const getSafeAreaInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      return {
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0')
      };
    };

    const updateOptimizations = () => {
      const isIOSDevice = detectIOS();
      setOptimizations({
        isIOS: isIOSDevice,
        isStandalone: isStandalone(),
        viewportHeight: isIOSDevice ? '100dvh' : '100vh',
        safeAreaInsets: getSafeAreaInsets()
      });
    };

    updateOptimizations();

    // Listen for orientation changes
    const handleOrientationChange = () => {
      setTimeout(updateOptimizations, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', updateOptimizations);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', updateOptimizations);
    };
  }, []);

  return optimizations;
};