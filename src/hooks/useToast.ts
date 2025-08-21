
// Consolidated toast hook - replaces both useToast and useEnhancedToast
import { toast } from "sonner";

export interface EnhancedToastOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  style?: React.CSSProperties;
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export const useToast = () => {
  const showSuccess = (options: EnhancedToastOptions | Omit<ToastOptions, 'variant'>) => {
    // Dismiss all existing toasts before showing new one
    toast.dismiss();
    
    if ('duration' in options || 'action' in options) {
      const enhancedOptions = options as EnhancedToastOptions;
      toast.success(enhancedOptions.title, {
        description: enhancedOptions.description,
        duration: enhancedOptions.duration || 4000,
        action: enhancedOptions.action ? {
          label: enhancedOptions.action.label,
          onClick: enhancedOptions.action.onClick,
        } : undefined,
        onDismiss: enhancedOptions.onDismiss,
        style: enhancedOptions.style,
      });
    } else {
      const simpleOptions = options as Omit<ToastOptions, 'variant'>;
      toast.success(simpleOptions.title, {
        description: simpleOptions.description,
      });
    }
  };

  const showError = (options: EnhancedToastOptions | Omit<ToastOptions, 'variant'>) => {
    // Dismiss all existing toasts before showing new one
    toast.dismiss();
    
    if ('duration' in options || 'action' in options) {
      const enhancedOptions = options as EnhancedToastOptions;
      console.error('Toast Error:', enhancedOptions.title, enhancedOptions.description);
      toast.error(enhancedOptions.title, {
        description: enhancedOptions.description,
        duration: enhancedOptions.duration || 6000,
        action: enhancedOptions.action ? {
          label: enhancedOptions.action.label,
          onClick: enhancedOptions.action.onClick,
        } : undefined,
        onDismiss: enhancedOptions.onDismiss,
        style: enhancedOptions.style,
      });
    } else {
      const simpleOptions = options as Omit<ToastOptions, 'variant'>;
      toast.error(simpleOptions.title, {
        description: simpleOptions.description,
      });
    }
  };

  const showInfo = (options: EnhancedToastOptions | Omit<ToastOptions, 'variant'>) => {
    // Dismiss all existing toasts before showing new one
    toast.dismiss();
    
    if ('duration' in options || 'action' in options) {
      const enhancedOptions = options as EnhancedToastOptions;
      toast.info(enhancedOptions.title, {
        description: enhancedOptions.description,
        duration: enhancedOptions.duration || 4000,
        action: enhancedOptions.action ? {
          label: enhancedOptions.action.label,
          onClick: enhancedOptions.action.onClick,
        } : undefined,
        onDismiss: enhancedOptions.onDismiss,
        style: enhancedOptions.style,
      });
    } else {
      const simpleOptions = options as Omit<ToastOptions, 'variant'>;
      toast(simpleOptions.title, {
        description: simpleOptions.description,
      });
    }
  };

  const showWarning = (options: EnhancedToastOptions | Omit<ToastOptions, 'variant'>) => {
    // Dismiss all existing toasts before showing new one
    toast.dismiss();
    
    if ('duration' in options || 'action' in options) {
      const enhancedOptions = options as EnhancedToastOptions;
      console.warn('Toast Warning:', enhancedOptions.title, enhancedOptions.description);
      toast.warning(enhancedOptions.title, {
        description: enhancedOptions.description,
        duration: enhancedOptions.duration || 5000,
        action: enhancedOptions.action ? {
          label: enhancedOptions.action.label,
          onClick: enhancedOptions.action.onClick,
        } : undefined,
        onDismiss: enhancedOptions.onDismiss,
        style: enhancedOptions.style,
      });
    } else {
      const simpleOptions = options as Omit<ToastOptions, 'variant'>;
      toast.warning(simpleOptions.title, {
        description: simpleOptions.description,
      });
    }
  };

  const showLoading = (title: string, promise: Promise<any>) => {
    // Dismiss all existing toasts before showing new one
    toast.dismiss();
    
    return toast.promise(promise, {
      loading: title,
      success: 'Operação concluída com sucesso!',
      error: (err) => {
        console.error('Promise Toast Error:', err);
        return 'Ocorreu um erro durante a operação';
      },
    });
  };

  return {
    toast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
  };
};

// Legacy compatibility
export const useEnhancedToast = useToast;
