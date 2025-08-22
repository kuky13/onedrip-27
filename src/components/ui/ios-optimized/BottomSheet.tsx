
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIOSOptimization } from '@/hooks/useIOSOptimization';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  defaultSnap?: number;
  showHandle?: boolean;
  className?: string;
}

export const BottomSheet = ({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.3, 0.6, 0.9],
  defaultSnap = 1,
  showHandle = true,
  className = ""
}: BottomSheetProps) => {
  const [currentSnap, setCurrentSnap] = useState(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const { viewportHeight, safeAreaInsets } = useIOSOptimization();

  const sheetHeight = `${snapPoints[currentSnap] * 100}%`;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handlePanEnd = (event: any, info: PanInfo) => {
    const { velocity, offset } = info;
    setIsDragging(false);

    // Close if dragged down significantly
    if (offset.y > 150 || velocity.y > 500) {
      onClose();
      return;
    }

    // Snap to closest point
    const currentHeight = window.innerHeight * snapPoints[currentSnap];
    const newHeight = currentHeight + offset.y;
    const newRatio = newHeight / window.innerHeight;

    let closestSnap = 0;
    let minDistance = Math.abs(snapPoints[0] - newRatio);

    snapPoints.forEach((point, index) => {
      const distance = Math.abs(point - newRatio);
      if (distance < minDistance) {
        minDistance = distance;
        closestSnap = index;
      }
    });

    setCurrentSnap(closestSnap);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            style={{ touchAction: 'none' }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ 
              y: isDragging ? undefined : "0%",
              height: sheetHeight 
            }}
            exit={{ y: "100%" }}
            transition={{ 
              type: "spring", 
              damping: 30, 
              stiffness: 300 
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handlePanEnd}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-background/95 backdrop-blur-xl",
              "rounded-t-3xl border-t border-border/50",
              "shadow-2xl",
              className
            )}
            style={{
              paddingBottom: safeAreaInsets.bottom || 0,
              touchAction: 'none'
            }}
          >
            {/* Handle */}
            {showHandle && (
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                <h2 className="text-lg font-semibold text-foreground">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted/50 rounded-full transition-colors"
                  style={{ touchAction: 'manipulation' }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div 
              className="flex-1 overflow-auto"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
