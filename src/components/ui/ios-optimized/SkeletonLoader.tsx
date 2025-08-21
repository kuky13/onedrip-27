
import React from 'react';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'image';
  lines?: number;
  animate?: boolean;
}

export const SkeletonLoader = ({
  className = "",
  variant = 'text',
  lines = 1,
  animate = true
}: SkeletonLoaderProps) => {
  const shimmerVariants: Variants = {
    initial: { x: '-100%' },
    animate: { 
      x: '100%',
      transition: {
        duration: 1.5,
        ease: [0.25, 0.1, 0.25, 1],
        repeat: Infinity,
        repeatDelay: 0.5
      }
    }
  };

  const baseClasses = "bg-muted/50 rounded-lg relative overflow-hidden";
  
  const variants = {
    text: "h-4 w-full",
    card: "h-32 w-full",
    avatar: "h-12 w-12 rounded-full",
    button: "h-10 w-24",
    image: "h-48 w-full"
  };

  const SkeletonElement = ({ className: elementClassName = "" }) => (
    <div className={cn(baseClasses, variants[variant], elementClassName)}>
      {animate && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
        />
      )}
    </div>
  );

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonElement 
            key={index}
            className={index === lines - 1 ? "w-3/4" : ""}
          />
        ))}
      </div>
    );
  }

  return <SkeletonElement className={className} />;
};

// Predefined skeleton layouts
export const BudgetCardSkeleton = () => (
  <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-1">
        <SkeletonLoader variant="text" className="h-5 w-2/3" />
        <SkeletonLoader variant="text" className="h-4 w-1/2" />
      </div>
      <SkeletonLoader variant="text" className="h-4 w-16" />
    </div>
    
    <SkeletonLoader variant="card" className="h-16" />
    
    <div className="space-y-2">
      <SkeletonLoader variant="text" className="h-4 w-1/4" />
      <SkeletonLoader variant="text" className="h-6 w-1/3" />
    </div>
    
    <div className="flex gap-3">
      <SkeletonLoader variant="button" className="flex-1 h-12" />
      <SkeletonLoader variant="button" className="flex-1 h-12" />
    </div>
  </div>
);

export const ClientListSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="flex items-center gap-3 p-3 bg-card rounded-xl">
        <SkeletonLoader variant="avatar" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader variant="text" className="w-2/3" />
          <SkeletonLoader variant="text" className="w-1/2 h-3" />
        </div>
        <SkeletonLoader variant="text" className="w-16 h-6" />
      </div>
    ))}
  </div>
);

export const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-2 gap-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="bg-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <SkeletonLoader variant="avatar" className="h-8 w-8" />
          <SkeletonLoader variant="text" className="w-8 h-4" />
        </div>
        <SkeletonLoader variant="text" className="w-3/4 h-6" />
        <SkeletonLoader variant="text" className="w-1/2 h-4" />
      </div>
    ))}
  </div>
);
