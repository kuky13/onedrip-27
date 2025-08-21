import React, { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Hook personalizado para feedback iOS
export const useIOSFeedback = () => {
  const { toast } = useToast();

  // Feedback tátil nativo
  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      const patterns = {
        light: 50,
        medium: 100,
        heavy: 200
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  // Toast otimizado para iOS
  const showIOSToast = useCallback((
    title: string, 
    description?: string, 
    variant: 'default' | 'destructive' | 'success' = 'default'
  ) => {
    hapticFeedback(variant === 'destructive' ? 'heavy' : 'light');
    
    toast({
      title,
      description,
      variant: variant === 'success' ? 'default' : variant,
      duration: variant === 'destructive' ? 5000 : 3000,
      className: `
        rounded-2xl border-0 shadow-xl backdrop-blur-xl
        ${variant === 'success' ? 'bg-green-600 text-white' : ''}
        ${variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-card/95'}
      `
    });
  }, [toast, hapticFeedback]);

  // Feedback de ação bem-sucedida
  const showSuccessAction = useCallback((message: string) => {
    showIOSToast('✓ Sucesso', message, 'success');
  }, [showIOSToast]);

  // Feedback de erro
  const showErrorAction = useCallback((message: string) => {
    showIOSToast('⚠️ Erro', message, 'destructive');
  }, [showIOSToast]);

  // Feedback de ação em progresso
  const showProgressAction = useCallback((message: string) => {
    showIOSToast('⏳ Processando', message);
  }, [showIOSToast]);

  return {
    hapticFeedback,
    showIOSToast,
    showSuccessAction,
    showErrorAction,
    showProgressAction
  };
};

// Componente de loading otimizado para iOS
export const IOSLoadingSpinner = ({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div 
      className={`${sizeClasses[size]} border-2 border-primary border-t-transparent rounded-full animate-spin`}
      style={{
        animationDuration: '1s',
        animationTimingFunction: 'linear'
      }}
    />
  );
};

// Componente de loading para tela cheia iOS
export const IOSFullscreenLoading = ({ message = 'Carregando...' }: { message?: string }) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className="text-center space-y-4">
        <IOSLoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
};