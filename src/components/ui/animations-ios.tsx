/**
 * iOS-specific animation utilities and components
 */

import React from 'react';
import { motion } from 'framer-motion';

// iOS bounce animation variants
export const iosAnimations = {
  slideIn: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
    transition: { type: 'spring' as const, damping: 20, stiffness: 300 }
  },
  
  slideUp: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 }
  },
  
  bounceIn: {
    initial: { scale: 0.3, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.3, opacity: 0 },
    transition: { type: 'spring' as const, damping: 15, stiffness: 400 }
  },
  
  fadeSlide: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  }
};

// iOS-optimized motion wrapper
interface IOSMotionProps {
  children: React.ReactNode;
  animation?: keyof typeof iosAnimations;
  delay?: number;
  className?: string;
}

export const IOSMotion = ({ 
  children, 
  animation = 'fadeSlide', 
  delay = 0,
  className = ""
}: IOSMotionProps) => {
  const animConfig = iosAnimations[animation];
  
  return (
    <motion.div
      className={className}
      initial={animConfig.initial}
      animate={animConfig.animate}
      exit={animConfig.exit}
      transition={{ ...animConfig.transition, delay } as any}
      style={{
        willChange: 'transform, opacity',
        WebkitBackfaceVisibility: 'hidden',
        WebkitPerspective: 1000,
        WebkitTransform: 'translate3d(0,0,0)'
      }}
    >
      {children}
    </motion.div>
  );
};

// Haptic feedback simulation for web
export const simulateHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  // iOS Safari haptic feedback (if supported)
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    navigator.vibrate(patterns[type]);
  }
};

// iOS safe area utilities
export const iosSafeAreaStyles = {
  paddingTop: 'env(safe-area-inset-top)',
  paddingBottom: 'env(safe-area-inset-bottom)',
  paddingLeft: 'env(safe-area-inset-left)',
  paddingRight: 'env(safe-area-inset-right)'
};

// iOS scroll optimization
export const iosScrollStyles = {
  WebkitOverflowScrolling: 'touch',
  overscrollBehavior: 'none',
  WebkitTapHighlightColor: 'transparent'
} as React.CSSProperties;