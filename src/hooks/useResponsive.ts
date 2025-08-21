import { useState, useEffect, useCallback, useMemo } from 'react';

// Breakpoints configuration
const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  isCompactHeight: boolean;
  isTouch: boolean;
  devicePixelRatio: number;
  currentBreakpoint: Breakpoint;
  isBreakpoint: (breakpoint: Breakpoint) => boolean;
  isAboveBreakpoint: (breakpoint: Breakpoint) => boolean;
  isBelowBreakpoint: (breakpoint: Breakpoint) => boolean;
}

interface MediaQueryState {
  reducedMotion: boolean;
  highContrast: boolean;
  darkMode: boolean;
}

// Debounce utility for performance
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Get current breakpoint based on width
function getCurrentBreakpoint(width: number): Breakpoint {
  const breakpointEntries = Object.entries(BREAKPOINTS) as [Breakpoint, number][];
  const sortedBreakpoints = breakpointEntries.sort((a, b) => b[1] - a[1]);
  
  for (const [breakpoint, minWidth] of sortedBreakpoints) {
    if (width >= minWidth) {
      return breakpoint;
    }
  }
  
  return 'xs';
}

// Check if device supports touch
function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

// Get device pixel ratio
function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

// Media query hook
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Main responsive hook
export function useResponsive(): ResponsiveState & MediaQueryState {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  // Debounce dimensions for performance
  const debouncedDimensions = useDebounce(dimensions, 150);

  // Media queries
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const highContrast = useMediaQuery('(prefers-contrast: high)');
  const darkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Update dimensions on resize
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Use passive listener for better performance
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Also listen for orientation change
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Memoized calculations for performance
  const { width, height } = debouncedDimensions;
  
  const isMobile = width < BREAKPOINTS.md;
  const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isDesktop = width >= BREAKPOINTS.lg;
  const isLandscape = width > height;
  const isPortrait = height > width;
  const isCompactHeight = height < 600;
  const isTouch = isTouchDevice();
  const devicePixelRatio = getDevicePixelRatio();
  const currentBreakpoint = getCurrentBreakpoint(width);

  // Callbacks defined outside of useMemo to avoid React hooks issues
  const isBreakpoint = useCallback((breakpoint: Breakpoint) => {
    return currentBreakpoint === breakpoint;
  }, [currentBreakpoint]);

  const isAboveBreakpoint = useCallback((breakpoint: Breakpoint) => {
    return width >= BREAKPOINTS[breakpoint];
  }, [width]);

  const isBelowBreakpoint = useCallback((breakpoint: Breakpoint) => {
    return width < BREAKPOINTS[breakpoint];
  }, [width]);

  const responsiveState = useMemo(() => ({
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isLandscape,
    isPortrait,
    isCompactHeight,
    isTouch,
    devicePixelRatio,
    currentBreakpoint,
    isBreakpoint,
    isAboveBreakpoint,
    isBelowBreakpoint,
  }), [
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isLandscape,
    isPortrait,
    isCompactHeight,
    isTouch,
    devicePixelRatio,
    currentBreakpoint,
    isBreakpoint,
    isAboveBreakpoint,
    isBelowBreakpoint,
  ]);

  return {
    ...responsiveState,
    reducedMotion,
    highContrast,
    darkMode,
  };
}

// Utility hook for specific breakpoint checks
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const { isAboveBreakpoint } = useResponsive();
  return isAboveBreakpoint(breakpoint);
}

// Utility hook for mobile detection
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
}

// Utility hook for tablet detection
export function useIsTablet(): boolean {
  const { isTablet } = useResponsive();
  return isTablet;
}

// Utility hook for desktop detection
export function useIsDesktop(): boolean {
  const { isDesktop } = useResponsive();
  return isDesktop;
}

// Utility hook for orientation
export function useOrientation(): 'landscape' | 'portrait' {
  const { isLandscape } = useResponsive();
  return isLandscape ? 'landscape' : 'portrait';
}

// Utility hook for safe area support
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea, { passive: true });
    window.addEventListener('orientationchange', updateSafeArea, { passive: true });

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
}

// Export breakpoints for external use
export { BREAKPOINTS };
export type { Breakpoint, ResponsiveState };