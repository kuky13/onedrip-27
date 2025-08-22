import { useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

export const useBudgetErrorHandler = () => {
  const { showError } = useToast();

  const handleError = useCallback((error: Error, context: string = 'Operação') => {
    console.error(`${context} error:`, error);
    showError({
      title: `Erro em ${context}`,
      description: error.message || 'Ocorreu um erro inesperado. Tente novamente.'
    });
  }, [showError]);

  const handleAsyncError = useCallback(async (asyncFn: () => Promise<void>, context: string = 'Operação') => {
    try {
      await asyncFn();
    } catch (error) {
      handleError(error as Error, context);
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
};