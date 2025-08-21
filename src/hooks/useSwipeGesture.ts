import { useEffect, useRef } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  preventScrollOnSwipe?: boolean;
}

export const useSwipeGesture = (options: SwipeGestureOptions) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    preventScrollOnSwipe = true
  } = options;

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX.current || !touchStartY.current) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      
      const diffX = touchStartX.current - currentX;
      const diffY = touchStartY.current - currentY;

      // Prevent scroll if horizontal swipe is detected and option is enabled
      if (preventScrollOnSwipe && Math.abs(diffX) > Math.abs(diffY)) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartX.current || !touchStartY.current) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const diffX = touchStartX.current - touchEndX;
      const diffY = touchStartY.current - touchEndY;

      // Only trigger swipe if horizontal movement is greater than vertical
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > threshold) {
          if (diffX > 0) {
            // Swipe Left
            onSwipeLeft?.();
          } else {
            // Swipe Right
            onSwipeRight?.();
          }
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold, preventScrollOnSwipe]);
};