
import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceInfo {
  type: DeviceType;
  width: number;
  height: number;
  isTouchDevice: boolean;
  orientation: 'portrait' | 'landscape';
  isUltraWide: boolean;
  density: 'compact' | 'comfortable' | 'spacious';
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

const getDeviceType = (width: number): DeviceType => {
  if (width < 768) return 'mobile';
  if (width < 1200) return 'tablet';
  return 'desktop';
};

const getDensity = (type: DeviceType, width: number) => {
  if (type === 'mobile') return 'compact';
  if (type === 'tablet') return 'comfortable';
  return width > 1600 ? 'spacious' : 'comfortable';
};

const getSafeArea = () => {
  if (typeof window === 'undefined' || !document?.documentElement) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  try {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
      bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
      right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
    };
  } catch (error) {
    console.warn('Error getting safe area:', error);
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
};

export const useDeviceType = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        type: 'desktop',
        width: 1920,
        height: 1080,
        isTouchDevice: false,
        orientation: 'landscape',
        isUltraWide: false,
        density: 'comfortable',
        safeArea: { top: 0, bottom: 0, left: 0, right: 0 }
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const type = getDeviceType(width);
    
    return {
      type,
      width,
      height,
      isTouchDevice: 'ontouchstart' in window,
      orientation: width > height ? 'landscape' : 'portrait',
      isUltraWide: width / height > 2.1,
      density: getDensity(type, width),
      safeArea: getSafeArea()
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      try {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const type = getDeviceType(width);
        
        setDeviceInfo({
          type,
          width,
          height,
          isTouchDevice: 'ontouchstart' in window,
          orientation: width > height ? 'landscape' : 'portrait',
          isUltraWide: width / height > 2.1,
          density: getDensity(type, width),
          safeArea: getSafeArea()
        });
      } catch (error) {
        console.warn('Error in handleResize:', error);
      }
    };

    const handleOrientationChange = () => {
      // Delay to ensure viewport has updated
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return deviceInfo;
};
