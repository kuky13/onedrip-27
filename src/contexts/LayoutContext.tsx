
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useDeviceType, DeviceInfo } from '@/hooks/useDeviceType';

interface LayoutContextType extends DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  showSidebar: boolean;
  showBottomNav: boolean;
  contentPadding: string;
  navigationStyle: 'sidebar' | 'bottom' | 'header';
  gridCols: string;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  containerMaxWidth: string;
  navHeight: string;
  // Enhanced responsive features
  isCompactHeight: boolean;
  isLandscapeTablet: boolean;
  isPortraitTablet: boolean;
  adaptiveSpacing: string;
  responsiveColumns: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  breakpoints: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
  };
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  // Performance optimizations
  reducedMotion: boolean;
  prefersHighContrast: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const deviceInfo = useDeviceType();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  const [isCompactHeight, setIsCompactHeight] = useState(false);

  // Detect user preferences
  useEffect(() => {
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      compactHeight: window.matchMedia('(max-height: 600px)')
    };

    const updatePreferences = () => {
      setReducedMotion(mediaQueries.reducedMotion.matches);
      setPrefersHighContrast(mediaQueries.highContrast.matches);
      setIsCompactHeight(mediaQueries.compactHeight.matches);
    };

    // Initial check
    updatePreferences();

    // Add listeners
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    // Cleanup
    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  };

  const getSafeArea = () => {
    try {
      const computedStyle = getComputedStyle(document.documentElement);
      return {
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
      };
    } catch {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }
  };
  
  const getSpacing = () => {
    const baseSpacing = {
      compact: { xs: 'space-y-1', sm: 'space-y-2', md: 'space-y-3', lg: 'space-y-4', xl: 'space-y-5' },
      comfortable: { xs: 'space-y-3', sm: 'space-y-4', md: 'space-y-6', lg: 'space-y-8', xl: 'space-y-10' },
      spacious: { xs: 'space-y-4', sm: 'space-y-6', md: 'space-y-8', lg: 'space-y-10', xl: 'space-y-12' }
    };

    // Adjust for compact height
    if (isCompactHeight) {
      return baseSpacing.compact;
    }

    return baseSpacing[deviceInfo.density] || baseSpacing.comfortable;
  };

  const getAdaptiveSpacing = () => {
    if (isCompactHeight) return 'space-y-2';
    if (deviceInfo.type === 'mobile') return 'space-y-3';
    if (deviceInfo.type === 'tablet') {
      return deviceInfo.orientation === 'portrait' ? 'space-y-4' : 'space-y-3';
    }
    return 'space-y-6';
  };

  const getContentPadding = () => {
    if (deviceInfo.type === 'mobile') {
      return isCompactHeight ? 'p-2 sm:p-3' : 'p-3 sm:p-4';
    }
    if (deviceInfo.type === 'tablet') {
      const basePadding = deviceInfo.orientation === 'portrait' ? 'p-4 md:p-6' : 'p-6 md:p-8';
      return isCompactHeight ? 'p-3 md:p-4' : basePadding;
    }
    return deviceInfo.isUltraWide ? 'p-8 xl:p-12' : 'p-6 lg:p-8';
  };

  const getResponsiveColumns = () => {
    return {
      mobile: 'grid-cols-1',
      tablet: deviceInfo.orientation === 'portrait' 
        ? 'grid-cols-1 sm:grid-cols-2' 
        : 'grid-cols-2 md:grid-cols-3',
      desktop: deviceInfo.isUltraWide 
        ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' 
        : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
    };
  };

  const getGridCols = () => {
    const columns = getResponsiveColumns();
    if (deviceInfo.type === 'mobile') return columns.mobile;
    if (deviceInfo.type === 'tablet') return columns.tablet;
    return columns.desktop;
  };

  const getNavHeight = () => {
    if (isCompactHeight) {
      if (deviceInfo.type === 'mobile') return 'h-12';
      if (deviceInfo.type === 'tablet') return 'h-14';
      return 'h-16';
    }
    
    if (deviceInfo.type === 'mobile') return 'h-14';
    if (deviceInfo.type === 'tablet') return 'h-16';
    return 'h-20';
  };

  const getContainerMaxWidth = () => {
    if (deviceInfo.isUltraWide) return 'max-w-screen-2xl';
    if (deviceInfo.type === 'desktop') return 'max-w-screen-xl';
    return 'max-w-full';
  };

  const layoutConfig: LayoutContextType = {
    ...deviceInfo,
    isMobile: deviceInfo.type === 'mobile',
    isTablet: deviceInfo.type === 'tablet',
    isDesktop: deviceInfo.type === 'desktop',
    showSidebar: deviceInfo.type === 'desktop',
    showBottomNav: deviceInfo.type === 'mobile',
    contentPadding: getContentPadding(),
    navigationStyle: deviceInfo.type === 'mobile' ? 'bottom' : deviceInfo.type === 'tablet' ? 'header' : 'sidebar',
    gridCols: getGridCols(),
    spacing: getSpacing(),
    containerMaxWidth: getContainerMaxWidth(),
    navHeight: getNavHeight(),
    // Enhanced responsive features
    isCompactHeight,
    isLandscapeTablet: deviceInfo.type === 'tablet' && deviceInfo.orientation === 'landscape',
    isPortraitTablet: deviceInfo.type === 'tablet' && deviceInfo.orientation === 'portrait',
    adaptiveSpacing: getAdaptiveSpacing(),
    responsiveColumns: getResponsiveColumns(),
    breakpoints,
    safeArea: getSafeArea(),
    // Performance optimizations
    reducedMotion,
    prefersHighContrast
  };

  return (
    <LayoutContext.Provider value={layoutConfig}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
