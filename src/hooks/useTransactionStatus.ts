// ============================================
// HOOK SIMPLIFICADO PARA STATUS DE TRANSAÇÕES PIX
// ============================================
// Hook customizado para monitorar status de transações PIX - versão simplificada

import { useState, useCallback } from 'react';
import type { PixTransaction } from '../../shared/types/pix';

// Estado do hook
interface UseTransactionStatusState {
  transaction: PixTransaction | null;
  isLoading: boolean;
  error: string | null;
}

// Resultado do hook
interface UseTransactionStatusResult extends UseTransactionStatusState {
  refreshStatus: () => Promise<void>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearError: () => void;
  getTimeRemaining: () => {
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  };
}

// Hook principal para monitorar uma transação específica
export const useTransactionStatus = (transactionId: string): UseTransactionStatusResult => {
  const [state, setState] = useState<UseTransactionStatusState>({
    transaction: null,
    isLoading: false,
    error: null
  });

  // Limpar erro
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Atualizar status da transação (simplificado)
  const refreshStatus = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Por enquanto, apenas simular verificação
      console.log('Verificando status da transação:', transactionId);
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar status';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [transactionId]);

  // Iniciar monitoramento (simplificado)
  const startMonitoring = useCallback(() => {
    console.log('Iniciando monitoramento da transação:', transactionId);
    refreshStatus();
  }, [refreshStatus, transactionId]);

  // Parar monitoramento (simplificado)
  const stopMonitoring = useCallback(() => {
    console.log('Parando monitoramento da transação:', transactionId);
  }, [transactionId]);

  // Calcular tempo restante (simplificado)
  const getTimeRemaining = useCallback(() => {
    if (!state.transaction) {
      return { hours: 23, minutes: 59, seconds: 59, isExpired: false };
    }

    const now = new Date().getTime();
    const expiresAt = new Date(state.transaction.expiresAt).getTime();
    const timeLeft = expiresAt - now;

    if (timeLeft <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, isExpired: false };
  }, [state.transaction]);

  return {
    ...state,
    refreshStatus,
    startMonitoring,
    stopMonitoring,
    clearError,
    getTimeRemaining
  };
};

export default useTransactionStatus;