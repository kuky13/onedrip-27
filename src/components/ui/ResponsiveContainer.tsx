import React, { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Maximum width constraint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';
  /** Padding configuration */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'adaptive';
  /** Center the container */
  center?: boolean;
  /** Enable safe area padding */
  safeArea?: boolean;
  /** Responsive behavior */
  responsive?: boolean;
  /** Custom breakpoint behavior */
  breakpointBehavior?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  /** Enable performance optimizations */
  optimized?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
  none: '',
};

const paddingClasses = {
  none: '',
  sm: 'px-2 py-1',
  md: 'px-4 py-2',
  lg: 'px-6 py-3',
  xl: 'px-8 py-4',
  adaptive: '', // Will be handled dynamically
};

export const ResponsiveContainer = forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  (
    {
      children,
      className,
      maxWidth = 'full',
      padding = 'adaptive',
      center = true,
      safeArea = false,
      responsive = true,
      breakpointBehavior,
      optimized = true,
      ...props
    },
    ref
  ) => {
    const {
      isMobile,
      isTablet,
      isDesktop,
      isCompactHeight,
      isLandscape,
      reducedMotion,
      width,
      height,
    } = useResponsive();

    // Dynamic padding based on device and context
    const getAdaptivePadding = () => {
      if (padding !== 'adaptive') return paddingClasses[padding];

      if (isMobile) {
        if (isCompactHeight) return 'px-3 py-1';
        if (isLandscape) return 'px-4 py-2';
        return 'px-4 py-3';
      }

      if (isTablet) {
        if (isLandscape) return 'px-6 py-3';
        return 'px-5 py-4';
      }

      return 'px-8 py-6';
    };

    // Dynamic max width based on content and device
    const getResponsiveMaxWidth = () => {
      if (!responsive) return maxWidthClasses[maxWidth];

      if (isMobile) return 'max-w-full';
      if (isTablet) return 'max-w-4xl';
      if (width > 1920) return 'max-w-7xl';
      
      return maxWidthClasses[maxWidth];
    };

    // Breakpoint-specific classes
    const getBreakpointClasses = () => {
      if (!breakpointBehavior) return '';

      const classes = [];
      
      if (breakpointBehavior.mobile && isMobile) {
        classes.push(breakpointBehavior.mobile);
      }
      
      if (breakpointBehavior.tablet && isTablet) {
        classes.push(breakpointBehavior.tablet);
      }
      
      if (breakpointBehavior.desktop && isDesktop) {
        classes.push(breakpointBehavior.desktop);
      }

      return classes.join(' ');
    };

    // Performance optimizations
    const getOptimizationClasses = () => {
      if (!optimized) return '';

      const classes = ['will-change-auto'];

      // GPU acceleration for animations
      if (!reducedMotion) {
        classes.push('gpu-accelerated');
      }

      // Optimize for touch devices
      if (isMobile) {
        classes.push('touch-manipulation');
      }

      return classes.join(' ');
    };

    // Safe area classes
    const getSafeAreaClasses = () => {
      if (!safeArea) return '';

      const classes = [];

      if (isMobile) {
        classes.push('safe-area-inset');
      }

      return classes.join(' ');
    };

    // Combine all classes
    const containerClasses = cn(
      // Base classes
      'w-full',
      
      // Centering
      center && 'mx-auto',
      
      // Max width
      getResponsiveMaxWidth(),
      
      // Padding
      getAdaptivePadding(),
      
      // Safe area
      getSafeAreaClasses(),
      
      // Breakpoint behavior
      getBreakpointClasses(),
      
      // Optimizations
      getOptimizationClasses(),
      
      // Responsive utilities
      responsive && [
        'container-responsive',
        isCompactHeight && 'compact-height-spacing',
        isMobile && 'mobile-optimized',
        isTablet && isLandscape && 'landscape-tablet-optimized',
        isTablet && !isLandscape && 'portrait-tablet-optimized',
      ],
      
      // Custom className
      className
    );

    // Container style for dynamic adjustments
    const containerStyle: React.CSSProperties = {
      // Dynamic viewport adjustments
      minHeight: isCompactHeight ? 'auto' : undefined,
      
      // Performance hints
      contain: optimized ? 'layout style paint' : undefined,
      
      // Smooth scrolling
      scrollBehavior: reducedMotion ? 'auto' : 'smooth',
      
      // Custom properties for CSS
      '--container-width': `${width}px`,
      '--container-height': `${height}px`,
      '--is-mobile': isMobile ? '1' : '0',
      '--is-tablet': isTablet ? '1' : '0',
      '--is-desktop': isDesktop ? '1' : '0',
      '--is-landscape': isLandscape ? '1' : '0',
      '--is-compact': isCompactHeight ? '1' : '0',
    } as React.CSSProperties;

    return (
      <div
        ref={ref}
        className={containerClasses}
        style={containerStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ResponsiveContainer.displayName = 'ResponsiveContainer';

// Preset variants for common use cases
export const MobileContainer = forwardRef<HTMLDivElement, Omit<ResponsiveContainerProps, 'responsive'>>(
  (props, ref) => (
    <ResponsiveContainer
      ref={ref}
      responsive={true}
      maxWidth="full"
      padding="adaptive"
      safeArea={true}
      {...props}
    />
  )
);

export const TabletContainer = forwardRef<HTMLDivElement, Omit<ResponsiveContainerProps, 'responsive'>>(
  (props, ref) => (
    <ResponsiveContainer
      ref={ref}
      responsive={true}
      maxWidth="2xl"
      padding="adaptive"
      {...props}
    />
  )
);

export const DesktopContainer = forwardRef<HTMLDivElement, Omit<ResponsiveContainerProps, 'responsive'>>(
  (props, ref) => (
    <ResponsiveContainer
      ref={ref}
      responsive={true}
      maxWidth="xl"
      padding="lg"
      {...props}
    />
  )
);

export const FluidContainer = forwardRef<HTMLDivElement, Omit<ResponsiveContainerProps, 'maxWidth'>>(
  (props, ref) => (
    <ResponsiveContainer
      ref={ref}
      maxWidth="full"
      padding="adaptive"
      responsive={true}
      {...props}
    />
  )
);

MobileContainer.displayName = 'MobileContainer';
TabletContainer.displayName = 'TabletContainer';
DesktopContainer.displayName = 'DesktopContainer';
FluidContainer.displayName = 'FluidContainer';