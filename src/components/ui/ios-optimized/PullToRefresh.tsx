
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh = ({
  onRefresh,
  children,
  className = "",
  threshold = 80,
  disabled = false
}: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || startY.current === 0) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    if (distance > 0) {
      e.preventDefault();
      const pullDistance = Math.min(distance * 0.5, threshold * 1.5);
      setPullDistance(pullDistance);
      setCanRefresh(pullDistance >= threshold);
    }
  }, [disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;

    if (canRefresh && pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setCanRefresh(false);
    startY.current = 0;
    currentY.current = 0;
  }, [disabled, isRefreshing, canRefresh, pullDistance, threshold, onRefresh]);

  const refreshOpacity = Math.min(pullDistance / threshold, 1);
  const refreshScale = 0.6 + (refreshOpacity * 0.4);
  const refreshRotate = isRefreshing ? 360 : pullDistance * 2;

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none'
      }}
    >
      {/* Pull to Refresh Indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: refreshOpacity,
              y: Math.min(pullDistance - 40, 20)
            }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center py-4"
          >
            <motion.div
              animate={{ 
                scale: refreshScale,
                rotate: isRefreshing ? [0, 360] : refreshRotate
              }}
              transition={isRefreshing ? {
                rotate: {
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }
              } : { duration: 0.1 }}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                canRefresh || isRefreshing 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              <RefreshCw className="h-4 w-4" />
            </motion.div>
            
            <motion.p
              animate={{ opacity: refreshOpacity }}
              className="text-xs text-muted-foreground mt-2 font-medium"
            >
              {isRefreshing 
                ? "Atualizando..." 
                : canRefresh 
                  ? "Solte para atualizar" 
                  : "Puxe para atualizar"
              }
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content with transform */}
      <motion.div
        animate={{ 
          y: pullDistance > 0 ? pullDistance * 0.3 : 0 
        }}
        transition={{ type: "tween", duration: 0.1 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
