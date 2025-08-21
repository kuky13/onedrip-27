/**
 * Componentes de Animação - OneDrip Design System
 * Microinterações e animações reutilizáveis
 */

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

// Variantes de animação reutilizáveis
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Componente de animação fade in up
interface FadeInUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  duration?: number;
}

export const FadeInUp: React.FC<FadeInUpProps> = ({
  children,
  delay = 0,
  className,
  duration = 0.5
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration,
      delay,
      ease: [0.4, 0, 0.2, 1]
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Componente de animação scale on hover
interface ScaleOnHoverProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

export const ScaleOnHover: React.FC<ScaleOnHoverProps> = ({
  children,
  scale = 1.02,
  className
}) => (
  <motion.div
    whileHover={{ scale }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 400, damping: 30 }}
    className={cn("cursor-pointer", className)}
  >
    {children}
  </motion.div>
);

// Componente de loading skeleton animado
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular'
}) => {
  const baseClasses = "animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted";

  const variantClasses = {
    text: "h-4 rounded",
    rectangular: "rounded-lg",
    circular: "rounded-full aspect-square"
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
    />
  );
};

// Componente de transição de página
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

// Componente de stagger para listas
interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggerList: React.FC<StaggerListProps> = ({
  children,
  className,
  staggerDelay = 0.1
}) => (
  <motion.div
    variants={staggerContainer}
    initial="initial"
    animate="animate"
    className={className}
  >
    {React.Children.map(children, (child, index) => (
      <motion.div
        key={index}
        variants={fadeInUp}
        transition={{ delay: index * staggerDelay }}
      >
        {child}
      </motion.div>
    ))}
  </motion.div>
);

// Componente de bounce para notificações
interface BounceProps {
  children: React.ReactNode;
  trigger?: boolean;
  className?: string;
}

export const Bounce: React.FC<BounceProps> = ({
  children,
  trigger = false,
  className
}) => (
  <motion.div
    animate={trigger ? { scale: [1, 1.1, 1] } : {}}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

// Componente de slide para modais
interface SlideModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const SlideModal: React.FC<SlideModalProps> = ({
  children,
  isOpen,
  onClose,
  direction = 'up'
}) => {
  const slideVariants = {
    up: { y: '100%' },
    down: { y: '-100%' },
    left: { x: '100%' },
    right: { x: '-100%' }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={slideVariants[direction]}
            animate={{ x: 0, y: 0 }}
            exit={slideVariants[direction]}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Hook para animações de scroll
export const useScrollAnimation = () => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
};