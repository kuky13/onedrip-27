
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IOSToastProps {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle
};

const toastStyles = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white', 
  info: 'bg-blue-600 text-white',
  warning: 'bg-orange-600 text-white'
};

export const IOSToast = ({
  id,
  title,
  description,
  type,
  duration = 4000,
  onClose
}: IOSToastProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = toastIcons[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30,
            mass: 0.8 
          }}
          className={cn(
            "rounded-2xl shadow-xl backdrop-blur-xl border-0 p-4 min-w-[320px] max-w-[400px]",
            "relative overflow-hidden",
            toastStyles[type]
          )}
          style={{
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translate3d(0,0,0)'
          }}
        >
          {/* Background blur effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
          
          <div className="relative flex items-start gap-3">
            <Icon className="h-6 w-6 flex-shrink-0 mt-0.5" />
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm leading-tight">
                {title}
              </h4>
              {description && (
                <p className="text-sm opacity-90 mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
              style={{ touchAction: 'manipulation' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Toast Container Component
interface IOSToastContainerProps {
  toasts: IOSToastProps[];
  onClose: (id: string) => void;
}

export const IOSToastContainer = ({ toasts, onClose }: IOSToastContainerProps) => {
  return (
    <div 
      className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <IOSToast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useIOSToast = () => {
  const [toasts, setToasts] = useState<IOSToastProps[]>([]);

  const addToast = (toast: Omit<IOSToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showSuccess = (title: string, description?: string) => {
    addToast({ title, description, type: 'success' });
  };

  const showError = (title: string, description?: string) => {
    addToast({ title, description, type: 'error' });
  };

  const showInfo = (title: string, description?: string) => {
    addToast({ title, description, type: 'info' });
  };

  const showWarning = (title: string, description?: string) => {
    addToast({ title, description, type: 'warning' });
  };

  return {
    toasts,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeToast
  };
};
