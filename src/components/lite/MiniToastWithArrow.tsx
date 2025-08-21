import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

interface MiniToastWithArrowProps {
  show: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
}

export const MiniToastWithArrow = ({ 
  show, 
  message, 
  onClose, 
  duration = 3000 
}: MiniToastWithArrowProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, duration, onClose]);

  if (!show && !isVisible) return null;

  return (
    <div 
      className={`
        absolute top-2 right-2 z-50
        bg-blue-500 text-white text-xs font-medium
        px-3 py-2 rounded-lg shadow-lg
        flex items-center gap-2
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-[-10px] opacity-0 scale-95'}
      `}
      style={{ 
        touchAction: 'manipulation',
        WebkitTransform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)'
      }}
    >
      <span>{message}</span>
      <ArrowUp className="h-3 w-3 animate-pulse" />
    </div>
  );
};