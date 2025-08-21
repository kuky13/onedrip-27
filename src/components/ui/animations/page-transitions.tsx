
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Transições de página iOS-style
export const pageTransitions = {
  slideLeft: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
  },
  slideRight: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 }
  },
  slideUp: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 }
  },
  fadeScale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 }
  },
  elastic: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 }
  }
};

interface PageTransitionProps {
  children: React.ReactNode;
  type?: keyof typeof pageTransitions;
  className?: string;
}

export const PageTransition = ({ 
  children, 
  type = 'slideLeft',
  className = ''
}: PageTransitionProps) => {
  const transition = pageTransitions[type];
  
  return (
    <motion.div
      className={cn('w-full h-full', className)}
      initial={transition.initial}
      animate={transition.animate}
      exit={transition.exit}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        duration: 0.3
      }}
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

// Container para animações de rota
interface RouteTransitionProps {
  children: React.ReactNode;
  location: string;
  className?: string;
}

export const RouteTransition = ({ 
  children, 
  location,
  className = ''
}: RouteTransitionProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        className={cn('w-full', className)}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Modal com animação iOS
interface ModalTransitionProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const ModalTransition = ({ 
  children, 
  isOpen, 
  onClose,
  className = ''
}: ModalTransitionProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'fixed inset-x-4 top-1/2 bg-card rounded-2xl shadow-2xl z-50',
              'border border-border/50 backdrop-blur-xl',
              className
            )}
            initial={{ 
              opacity: 0, 
              scale: 0.95, 
              y: '-50%' 
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: '-50%' 
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.95, 
              y: '-50%' 
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30
            }}
            style={{
              transformOrigin: 'center',
              WebkitBackfaceVisibility: 'hidden'
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Stagger container para listas
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggerContainer = ({ 
  children, 
  className = '',
  staggerDelay = 0.1
}: StaggerContainerProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};
