
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
  const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { x, y, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);
    
    simulateHaptic('light');
    onClick?.();
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
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
    <motion.button
      className={cn(
        'relative overflow-hidden rounded-2xl font-medium transition-all duration-200',
        'transform-gpu active:scale-95',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      whileTap={{ scale: 0.95 }}
      style={{
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {children}
      
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          initial={{ 
            width: 0, 
            height: 0, 
            x: ripple.x, 
            y: ripple.y,
            opacity: 0.6
          }}
          animate={{ 
            width: 100, 
            height: 100, 
            x: ripple.x - 50, 
            y: ripple.y - 50,
            opacity: 0
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </motion.button>
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
    <motion.div
      className={cn(
        'bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl',
        'shadow-lg hover:shadow-xl transition-all duration-300',
        hover && 'hover:bg-card/90 hover:border-border/70',
        onClick && 'cursor-pointer',
        className
      )}
      whileHover={hover ? { 
        scale: 1.02,
        y: -2,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      style={{
        WebkitBackfaceVisibility: 'hidden',
        WebkitPerspective: 1000,
        WebkitTransform: 'translate3d(0,0,0)'
      }}
    >
      {children}
    </motion.div>
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
    <motion.span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      initial={animate ? { scale: 0 } : {}}
      animate={animate ? { scale: 1 } : {}}
      transition={{ 
        type: 'spring', 
        stiffness: 500, 
        damping: 30,
        delay: 0.1
      }}
    >
      {children}
    </motion.span>
  );
};
