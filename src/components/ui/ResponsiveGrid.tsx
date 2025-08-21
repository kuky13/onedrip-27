import React, { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of columns for different breakpoints */
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    ultrawide?: number;
  };
  /** Gap between grid items */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'adaptive';
  /** Minimum item width (auto-fit behavior) */
  minItemWidth?: string;
  /** Enable auto-fit behavior */
  autoFit?: boolean;
  /** Responsive behavior */
  responsive?: boolean;
  /** Aspect ratio for grid items */
  aspectRatio?: 'square' | '16/9' | '4/3' | '3/2' | 'auto';
  /** Enable masonry layout */
  masonry?: boolean;
  /** Performance optimizations */
  optimized?: boolean;
}

const gapClasses = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  adaptive: '', // Will be handled dynamically
};

const aspectRatioClasses = {
  square: 'aspect-square',
  '16/9': 'aspect-video',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
  auto: '',
};

export const ResponsiveGrid = forwardRef<HTMLDivElement, ResponsiveGridProps>(
  (
    {
      children,
      className,
      columns = {
        mobile: 1,
        tablet: 2,
        desktop: 3,
        ultrawide: 4,
      },
      gap = 'adaptive',
      minItemWidth,
      autoFit = false,
      responsive = true,
      aspectRatio = 'auto',
      masonry = false,
      optimized = true,
      ...props
    },
    ref
  ) => {
    const {
      isMobile,
      isTablet,
      isDesktop,
      isLandscape,
      isCompactHeight,
      reducedMotion,
      width,
    } = useResponsive();

    // Get current column count based on device
    const getCurrentColumns = () => {
      if (!responsive) return columns.desktop || 3;

      if (width > 1920) return columns.ultrawide || 4;
      if (isDesktop) return columns.desktop || 3;
      if (isTablet) {
        if (isLandscape) return Math.max(columns.tablet || 2, 2);
        return columns.tablet || 2;
      }
      if (isMobile) {
        if (isLandscape && !isCompactHeight) return 2;
        return columns.mobile || 1;
      }

      return columns.desktop || 3;
    };

    // Get adaptive gap based on device and context
    const getAdaptiveGap = () => {
      if (gap !== 'adaptive') return gapClasses[gap];

      if (isMobile) {
        if (isCompactHeight) return 'gap-2';
        if (isLandscape) return 'gap-3';
        return 'gap-4';
      }

      if (isTablet) {
        if (isLandscape) return 'gap-4';
        return 'gap-6';
      }

      return 'gap-6';
    };

    // Generate grid template columns
    const getGridColumns = () => {
      const currentColumns = getCurrentColumns();

      if (autoFit && minItemWidth) {
        return `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`;
      }

      return `repeat(${currentColumns}, 1fr)`;
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

    // Masonry layout classes
    const getMasonryClasses = () => {
      if (!masonry) return '';

      return 'masonry masonry-sm md:masonry-md lg:masonry-lg';
    };

    // Combine all classes
    const gridClasses = cn(
      // Base grid classes
      'grid w-full',
      
      // Gap
      getAdaptiveGap(),
      
      // Aspect ratio for children
      aspectRatio !== 'auto' && `[&>*]:${aspectRatioClasses[aspectRatio]}`,
      
      // Masonry
      getMasonryClasses(),
      
      // Optimizations
      getOptimizationClasses(),
      
      // Responsive utilities
      responsive && [
        'grid-adaptive',
        isCompactHeight && 'compact-height-spacing',
        isMobile && 'mobile-grid',
        isTablet && isLandscape && 'landscape-tablet-grid',
        isTablet && !isLandscape && 'portrait-tablet-grid',
        width > 1920 && 'ultra-wide-grid',
      ],
      
      // Custom className
      className
    );

    // Grid style for dynamic adjustments
    const gridStyle: React.CSSProperties = {
      // Dynamic grid template columns
      gridTemplateColumns: getGridColumns(),
      
      // Performance hints
      contain: optimized ? 'layout style paint' : undefined,
      
      // Custom properties for CSS
      '--grid-columns': getCurrentColumns(),
      '--grid-gap': gap === 'adaptive' ? 'var(--spacing-md)' : undefined,
      '--is-mobile': isMobile ? '1' : '0',
      '--is-tablet': isTablet ? '1' : '0',
      '--is-desktop': isDesktop ? '1' : '0',
      '--is-landscape': isLandscape ? '1' : '0',
      '--is-compact': isCompactHeight ? '1' : '0',
    } as React.CSSProperties;

    return (
      <div
        ref={ref}
        className={gridClasses}
        style={gridStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ResponsiveGrid.displayName = 'ResponsiveGrid';

// Preset variants for common use cases
export const MobileGrid = forwardRef<HTMLDivElement, Omit<ResponsiveGridProps, 'columns'>>(
  (props, ref) => (
    <ResponsiveGrid
      ref={ref}
      columns={{
        mobile: 1,
        tablet: 2,
        desktop: 2,
        ultrawide: 3,
      }}
      {...props}
    />
  )
);

export const TabletGrid = forwardRef<HTMLDivElement, Omit<ResponsiveGridProps, 'columns'>>(
  (props, ref) => (
    <ResponsiveGrid
      ref={ref}
      columns={{
        mobile: 1,
        tablet: 2,
        desktop: 3,
        ultrawide: 4,
      }}
      {...props}
    />
  )
);

export const DesktopGrid = forwardRef<HTMLDivElement, Omit<ResponsiveGridProps, 'columns'>>(
  (props, ref) => (
    <ResponsiveGrid
      ref={ref}
      columns={{
        mobile: 1,
        tablet: 2,
        desktop: 4,
        ultrawide: 5,
      }}
      {...props}
    />
  )
);

export const CardGrid = forwardRef<HTMLDivElement, Omit<ResponsiveGridProps, 'autoFit' | 'minItemWidth'>>(
  (props, ref) => (
    <ResponsiveGrid
      ref={ref}
      autoFit={true}
      minItemWidth="280px"
      gap="md"
      {...props}
    />
  )
);

export const ImageGrid = forwardRef<HTMLDivElement, Omit<ResponsiveGridProps, 'aspectRatio'>>(
  (props, ref) => (
    <ResponsiveGrid
      ref={ref}
      aspectRatio="square"
      gap="sm"
      {...props}
    />
  )
);

MobileGrid.displayName = 'MobileGrid';
TabletGrid.displayName = 'TabletGrid';
DesktopGrid.displayName = 'DesktopGrid';
CardGrid.displayName = 'CardGrid';
ImageGrid.displayName = 'ImageGrid';