
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Skeleton loader avançado
interface AdvancedSkeletonProps {
  className?: string;
  lines?: number;
  avatar?: boolean;
  showShimmer?: boolean;
}

export const AdvancedSkeleton = ({ 
  className = '', 
  lines = 1,
  avatar = false,
  showShimmer = true
}: AdvancedSkeletonProps) => {
  const shimmerVariants = {
    initial: { x: '-100%' },
    animate: { 
      x: '100%',
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 0.5
      }
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {avatar && (
        <div className="flex items-center space-x-3">
          <div className="relative overflow-hidden bg-muted rounded-full h-12 w-12">
            {showShimmer && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
              />
            )}
          </div>
          <div className="space-y-2 flex-1">
            <div className="relative overflow-hidden bg-muted rounded h-4 w-3/4">
              {showShimmer && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{
                    duration: 1.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 0.5
                  }}
                />
              )}
            </div>
            <div className="relative overflow-hidden bg-muted rounded h-3 w-1/2">
            {showShimmer && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
              />
            )}
            </div>
          </div>
        </div>
      )}
      
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            'relative overflow-hidden bg-muted rounded h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        >
          {showShimmer && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 0.5
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// Loading spinner iOS-style
interface IOSSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const IOSSpinner = ({ 
  size = 'md', 
  color = 'currentColor',
  className = ''
}: IOSSpinnerProps) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <motion.div
      className={cn(
        'inline-block border-2 border-current border-t-transparent rounded-full',
        sizes[size],
        className
      )}
      style={{ color }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  );
};

// Dots loader
interface DotsLoaderProps {
  className?: string;
  dotClassName?: string;
}

export const DotsLoader = ({ 
  className = '', 
  dotClassName = ''
}: DotsLoaderProps) => {
  const dotVariants = {
    initial: { scale: 0.8, opacity: 0.5 },
    animate: { scale: 1, opacity: 1 }
  };

  return (
    <div className={cn('flex space-x-2', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn('w-2 h-2 bg-current rounded-full', dotClassName)}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  );
};

// Pulse loader
interface PulseLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PulseLoader = ({ 
  className = '', 
  size = 'md'
}: PulseLoaderProps) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <motion.div
      className={cn(
        'rounded-full bg-primary/20 flex items-center justify-center',
        sizes[size],
        className
      )}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.5, 1]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      <motion.div
        className={cn(
          'rounded-full bg-primary/40',
          size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'
        )}
        animate={{
          scale: [1, 0.8, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </motion.div>
  );
};

// Progress circle
interface ProgressCircleProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
}

export const ProgressCircle = ({ 
  value, 
  max = 100, 
  size = 120,
  strokeWidth = 8,
  className = '',
  showValue = true
}: ProgressCircleProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / max) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className="text-primary"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      </svg>
      
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-lg font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {Math.round((value / max) * 100)}%
          </motion.span>
        </div>
      )}
    </div>
  );
};
