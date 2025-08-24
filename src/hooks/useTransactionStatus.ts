// ============================================
// HOOK PARA STATUS DE TRANSAÇÕES PIX
// ============================================
// Hook customizado para monitorar status de transações PIX

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type {
  PixTransaction,
  PixTransactionStatus,
  TransactionStatistics
} from '../../shared/types/pix';
import { pixTransactionService } from '../services/pixTransactionService';
import { mercadoPagoService } from '../services/mercadoPagoService';
import { auditService } from '../services/auditService';

// Estado do hook
interface UseTransactionStatusState {
  transaction: PixTransaction | null;
  isLoading: boolean;
  error: string | null;
  isMonitoring: boolean;
  lastChecked: Date | null;
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
    error: null,
    isMonitoring: false,
    lastChecked: null
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Limpar erro
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Buscar transação atual
  const fetchTransaction = useCallback(async (): Promise<PixTransaction | null> => {
    try {
      const transaction = pixTransactionService.getTransaction(transactionId);
      if (!transaction) {
        throw new Error('Transação não encontrada');
      }
      return transaction;
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      throw error;
    }
  }, [transactionId]);

  // Verificar status com Mercado Pago
  const checkWithMercadoPago = useCallback(async (transaction: PixTransaction): Promise<void> => {
    try {
      if (!transaction.mercadoPagoId) {
        return;
      }

      const payment = await mercadoPagoService.checkPaymentStatus(transaction.mercadoPagoId);
      
      // Mapear status do Mercado Pago para nosso sistema
      let newStatus: PixTransactionStatus = transaction.status;
      
      switch (payment.status) {
        case 'approved':
          newStatus = 'paid';
          break;
        case 'pending':
          newStatus = 'pending';
          break;
        case 'cancelled':
        case 'rejected':
          newStatus = 'cancelled';
          break;
      }

      // Atualizar status se mudou
      if (newStatus !== transaction.status) {
        await pixTransactionService.updateTransactionStatus(transactionId, newStatus, {
          mercadoPagoData: payment
        });
      }

    } catch (error) {
      console.error('Erro ao verificar com Mercado Pago:', error);
      // Não propagar erro para não interromper o monitoramento
    }
  }, [transactionId]);

  // Atualizar status da transação
  const refreshStatus = useCallback(async (): Promise<void> => {
    if (!mountedRef.current) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Buscar transação atualizada
      const transaction = await fetchTransaction();
      
      if (!mountedRef.current) return;

      // Verificar com Mercado Pago se ainda está pendente
      if (transaction.status === 'pending') {
        await checkWithMercadoPago(transaction);
        
        // Buscar novamente após verificação
        const updatedTransaction = await fetchTransaction();
        
        if (!mountedRef.current) return;
        
        setState(prev => ({
          ...prev,
          transaction: updatedTransaction,
          isLoading: false,
          lastChecked: new Date()
        }));
      } else {
        setState(prev => ({
          ...prev,
          transaction,
          isLoading: false,
          lastChecked: new Date()
        }));
      }

    } catch (error) {
      if (!mountedRef.current) return;
      
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar status';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      // Log do erro
      await auditService.logEvent({
        action: 'transaction_status_check_error',
        details: {
          transactionId,
          error: errorMessage
        },
        severity: 'error'
      });
    }
  }, [transactionId, fetchTransaction, checkWithMercadoPago]);

  // Iniciar monitoramento automático
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setState(prev => ({ ...prev, isMonitoring: true }));

    // Verificar imediatamente
    refreshStatus();

    // Verificar a cada 30 segundos
    intervalRef.current = setInterval(() => {
      refreshStatus();
    }, 30000);

  }, [refreshStatus]);

  // Parar monitoramento
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState(prev => ({ ...prev, isMonitoring: false }));
  }, []);

  // Calcular tempo restante
  const getTimeRemaining = useCallback(() => {
    if (!state.transaction) {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
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

  // Efeito para carregar transação inicial
  useEffect(() => {
    if (transactionId) {
      refreshStatus();
    }
  }, [transactionId, refreshStatus]);

  // Efeito para parar monitoramento quando transação for finalizada
  useEffect(() => {
    if (state.transaction && ['paid', 'expired', 'cancelled'].includes(state.transaction.status)) {
      stopMonitoring();
      
      // Mostrar notificação baseada no status
      switch (state.transaction.status) {
        case 'paid':
          toast.success('Pagamento confirmado! 🎉');
          break;
        case 'expired':
          toast.error('Código PIX expirou. Gere um novo código.');
          break;
        case 'cancelled':
          toast.error('Pagamento cancelado.');
          break;
      }
    }
  }, [state.transaction, stopMonitoring]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    refreshStatus,
    startMonitoring,
    stopMonitoring,
    clearError,
    getTimeRemaining
  };
};

// Hook para listar transações do usuário
export const useUserTransactions = (userEmail?: string) => {
  const [transactions, setTransactions] = useState<PixTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!userEmail) return;

    try {
      setIsLoading(true);
      setError(null);

      const userTransactions = pixTransactionService.getTransactionsByUser(userEmail);
      setTransactions(userTransactions);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar transações';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refreshTransactions: loadTransactions
  };
};

// Hook para estatísticas de transações
export const useTransactionStatistics = () => {
  const [statistics, setStatistics] = useState<TransactionStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      const stats = pixTransactionService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
    
    // Atualizar estatísticas a cada 5 minutos
    const interval = setInterval(loadStatistics, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadStatistics]);

  return {
    statistics,
    isLoading,
    refreshStatistics: loadStatistics
  };
};

export default useTransactionStatus;