// ============================================
// HOOK PARA PAGAMENTOS PIX
// ============================================
// Hook customizado para gerenciar pagamentos PIX

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type {
  CreatePixTransactionRequest,
  CreatePixTransactionResponse,
  PixTransaction,
  PlanType
} from '../../shared/types/pix';
import { mercadoPagoService } from '../services/mercadoPagoService';
import { pixTransactionService } from '../services/pixTransactionService';
import { auditService } from '../services/auditService';

// Estado do hook
interface UsePixPaymentState {
  isLoading: boolean;
  error: string | null;
  transaction: PixTransaction | null;
  isCreatingPayment: boolean;
}

// Resultado do hook
interface UsePixPaymentResult extends UsePixPaymentState {
  createPixPayment: (request: CreatePixTransactionRequest) => Promise<CreatePixTransactionResponse | null>;
  clearError: () => void;
  clearTransaction: () => void;
  retryPayment: () => Promise<CreatePixTransactionResponse | null>;
}

// Hook principal
export const usePixPayment = (): UsePixPaymentResult => {
  const [state, setState] = useState<UsePixPaymentState>({
    isLoading: false,
    error: null,
    transaction: null,
    isCreatingPayment: false
  });

  // Última requisição para retry
  const [lastRequest, setLastRequest] = useState<CreatePixTransactionRequest | null>(null);

  // Esta função foi removida - funcionalidade movida para createPixPayment

  // Limpar erro
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Limpar transação
  const clearTransaction = useCallback(() => {
    setState(prev => ({ ...prev, transaction: null, error: null }));
  }, []);

  // Validar dados da requisição
  const validateRequest = (request: CreatePixTransactionRequest): string | null => {
    if (!request.userEmail || !request.userEmail.includes('@')) {
      return 'Email inválido';
    }

    if (!request.planType || !['monthly', 'yearly'].includes(request.planType)) {
      return 'Tipo de plano inválido';
    }

    if (typeof request.isVip !== 'boolean') {
      return 'Opção VIP deve ser especificada';
    }

    return null;
  };

  // Criar pagamento PIX
  const createPixPayment = useCallback(async (
    request: CreatePixTransactionRequest
  ): Promise<CreatePixTransactionResponse | null> => {
    try {
      // Validar requisição
      const validationError = validateRequest(request);
      if (validationError) {
        setState(prev => ({ ...prev, error: validationError }));
        toast.error(validationError);
        return null;
      }

      // Iniciar loading
      setState(prev => ({ 
        ...prev, 
        isLoading: true, 
        isCreatingPayment: true, 
        error: null 
      }));

      // Salvar requisição para retry
      setLastRequest(request);

      // Log da tentativa
      await auditService.logEvent({
        action: 'pix_payment_attempt',
        details: {
          planType: request.planType,
          isVip: request.isVip,
          userEmail: request.userEmail
        },
        userEmail: request.userEmail
      });

      // Criar pagamento
      const response = await mercadoPagoService.createPixPayment(request);

      // Adicionar transação ao serviço
      await pixTransactionService.addTransaction(response.transaction);

      // Atualizar estado com sucesso
      setState(prev => ({
        ...prev,
        isLoading: false,
        isCreatingPayment: false,
        transaction: response.transaction,
        error: null
      }));

      // Mostrar sucesso
      toast.success('Código PIX gerado com sucesso!');

      // Log de sucesso
      await auditService.logEvent({
        action: 'pix_payment_created_success',
        details: {
          transactionId: response.transaction.id,
          amount: response.transaction.pixCode.amount,
          planType: request.planType
        },
        userEmail: request.userEmail
      });

      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar pagamento PIX';
      
      // Atualizar estado com erro
      setState(prev => ({
        ...prev,
        isLoading: false,
        isCreatingPayment: false,
        error: errorMessage
      }));

      // Mostrar erro
      toast.error(errorMessage);

      // Log do erro
      await auditService.logEvent({
        action: 'pix_payment_creation_error',
        details: {
          error: errorMessage,
          planType: request.planType,
          isVip: request.isVip
        },
        userEmail: request.userEmail
      });

      return null;
    }
  }, []);

  // Tentar novamente o último pagamento
  const retryPayment = useCallback(async (): Promise<CreatePixTransactionResponse | null> => {
    if (!lastRequest) {
      const errorMessage = 'Nenhuma requisição anterior para tentar novamente';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
      return null;
    }

    return createPixPayment(lastRequest);
  }, [lastRequest, createPixPayment]);

  return {
    ...state,
    createPixPayment,
    clearError,
    clearTransaction,
    retryPayment
  };
};

// Hook para criar pagamento com plano específico
export const useCreatePlanPayment = () => {
  const { createPixPayment, ...rest } = usePixPayment();

  const createPaymentForPlan = useCallback(async (
    planType: PlanType,
    isVip: boolean,
    userEmail: string,
    userId?: string
  ) => {
    const request: CreatePixTransactionRequest = {
      planType,
      isVip,
      userEmail,
      userId
    };

    return createPixPayment(request);
  }, [createPixPayment]);

  return {
    ...rest,
    createPaymentForPlan
  };
};

// Hook para pagamento rápido (com dados do usuário atual)
export const useQuickPixPayment = (userEmail?: string, userId?: string) => {
  const { createPixPayment, ...rest } = usePixPayment();

  const quickCreatePayment = useCallback(async (
    planType: PlanType,
    isVip: boolean
  ) => {
    if (!userEmail) {
      toast.error('Email do usuário não informado');
      return null;
    }

    const request: CreatePixTransactionRequest = {
      planType,
      isVip,
      userEmail,
      userId
    };

    return createPixPayment(request);
  }, [createPixPayment, userEmail, userId]);

  return {
    ...rest,
    quickCreatePayment,
    isUserDataAvailable: !!userEmail
  };
};

export default usePixPayment;