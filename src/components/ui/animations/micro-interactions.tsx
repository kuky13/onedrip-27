
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Haptic feedback simulado
export const simulateHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    navigator.vibrate(patterns[type]);
  }
};

// Botão com ripple effect
interface RippleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const RippleButton = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false
}: RippleButtonProps) => {
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    onClick?.();
  };

  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4',
    lg: 'h-12 px-6 text-lg'
  };

  return (
    <button
      className={cn(
        'rounded-2xl font-medium transition-all duration-200 ease-in-out',
        'hover:opacity-90',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      style={{
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {children}
    </button>
  );
};

// Card com hover effect avançado
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const GlassCard = ({ 
  children, 
  className = '', 
  hover = true,
  onClick 
}: GlassCardProps) => {
  return (
    <div
      className={cn(
        'bg-card/80 border border-border/50 rounded-2xl',
        'shadow-lg transition-all duration-300 ease-in-out',
        hover && 'hover:bg-card/90 hover:border-border/70 hover:shadow-xl',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Contador animado
interface CounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export const AnimatedCounter = ({ value, duration = 1, className = '' }: CounterProps) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const increment = value / (duration * 60); // 60 FPS
    
    const counter = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(counter);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(counter);
  }, [value, duration]);

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {count}
    </motion.span>
  );
};

// Progress bar animada
interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  showValue?: boolean;
}

export const AnimatedProgress = ({ 
  value, 
  max = 100, 
  className = '',
  showValue = false 
}: AnimatedProgressProps) => {
  const percentage = (value / max) * 100;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-2">
        {showValue && (
          <span className="text-sm text-muted-foreground">
            {value} / {max}
          </span>
        )}
        <span className="text-sm font-medium">
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// Badge com bounce animation
interface BounceBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  className?: string;
  animate?: boolean;
}

export const BounceBadge = ({ 
  children, 
  variant = 'default',
  className = '',
  animate = true
}: BounceBadgeProps) => {
  const variants = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-green-500/20 text-green-700',
    warning: 'bg-yellow-500/20 text-yellow-700',
    destructive: 'bg-red-500/20 text-red-700'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-opacity duration-300',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
