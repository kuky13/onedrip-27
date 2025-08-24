// ============================================
// HOOK PARA PAGAMENTOS PIX
// ============================================
// Hook customizado para gerenciar pagamentos PIX

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type {
  CreatePixTransactionRequest,
  CreatePixTransactionResponse,
  PixTransaction,
  PlanType
} from '../../shared/types/pix';
import { createPixPreference, type PixPaymentData, type PixPreferenceResponse } from '../services/paymentService';
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
  const [isConfigValid, setIsConfigValid] = useState<boolean | null>(null);

  // Última requisição para retry
  const [lastRequest, setLastRequest] = useState<CreatePixTransactionRequest | null>(null);

  // Validar configuração na inicialização
   useEffect(() => {
     const validateConfig = async () => {
       try {
         const isValid = await paymentService.validateBackendConfig();
         setIsConfigValid(isValid);
         
         if (!isValid) {
           toast.error('Configuração do sistema de pagamento inválida. Contate o suporte.');
         }
       } catch (error) {
         console.error('Erro ao validar configuração:', error);
         setIsConfigValid(false);
       }
     };
     
     validateConfig();
   }, []);

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
    // Validar email
    if (!request.userEmail) {
      return 'Email é obrigatório';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.userEmail)) {
      return 'Email inválido. Verifique o formato do email.';
    }

    // Validar tipo de plano
    if (!request.planType) {
      return 'Tipo de plano é obrigatório';
    }
    
    if (!['monthly', 'yearly'].includes(request.planType)) {
      return 'Tipo de plano inválido. Deve ser "monthly" ou "yearly".';
    }

    // Validar opção VIP
    if (typeof request.isVip !== 'boolean') {
      return 'Opção VIP deve ser especificada (true ou false)';
    }

    return null;
  };

  // Criar pagamento PIX
  const createPixPayment = useCallback(async (
    request: CreatePixTransactionRequest
  ): Promise<CreatePixTransactionResponse | null> => {
    try {
      // Verificar se a configuração é válida antes de prosseguir
      if (isConfigValid === false) {
        const errorMsg = 'Sistema de pagamento não configurado. Contate o suporte.';
        setState(prev => ({ ...prev, error: errorMsg }));
        toast.error(errorMsg);
        return null;
      }
      
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

      // Criar pagamento via backend
      const paymentData: PixPaymentData = {
        planType: request.planType,
        isVip: request.isVip,
        userEmail: request.userEmail
      };
      
      const backendResponse = await createPixPreference(paymentData);
      
      if (!backendResponse.success) {
        throw new Error(backendResponse.error || 'Erro ao criar preferência de pagamento');
      }
      
      // Converter resposta do backend para formato esperado
      const response: CreatePixTransactionResponse = {
        transaction: {
          id: backendResponse.transactionId!,
          userId: request.userId,
          userEmail: request.userEmail,
          planType: request.planType,
          isVip: request.isVip,
          amount: backendResponse.amount!,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(backendResponse.expirationDate!),
          pixCode: {
            id: `pix_${backendResponse.transactionId}`,
            transactionId: backendResponse.transactionId!,
            qrCode: backendResponse.qrCode!,
            qrCodeBase64: backendResponse.qrCodeBase64!,
            amount: backendResponse.amount!,
            expirationDate: new Date(backendResponse.expirationDate!),
            createdAt: new Date()
          }
        }
      };

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
      console.error('❌ [usePixPayment] Erro na criação do pagamento PIX:', error);
      
      let errorMessage = 'Erro ao gerar código PIX. Tente novamente.';
      let errorCode = 'UNKNOWN_ERROR';
      
      if (error instanceof Error) {
        // Tratar mensagens de erro específicas do backend
        if (error.message.includes('Network Error') || error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Erro de conexão com o servidor. Verifique sua internet e tente novamente.';
          errorCode = 'NETWORK_ERROR';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Tempo limite excedido. Tente novamente.';
          errorCode = 'TIMEOUT_ERROR';
        } else if (error.message.includes('Erro ao criar preferência')) {
          errorMessage = 'Erro ao processar o pagamento. Verifique os dados e tente novamente.';
          errorCode = 'PREFERENCE_ERROR';
        } else if (error.message.includes('Credenciais do Mercado Pago inválidas')) {
          errorMessage = 'Erro de configuração do sistema de pagamento. Entre em contato com o suporte.';
          errorCode = 'CREDENTIALS_ERROR';
        } else if (error.message.includes('Sistema PIX não está configurado')) {
          errorMessage = 'Sistema de pagamento PIX temporariamente indisponível. Tente novamente mais tarde.';
          errorCode = 'PIX_UNAVAILABLE';
        } else if (error.message.includes('Dados inválidos')) {
          errorMessage = 'Dados do pagamento inválidos. Verifique as informações e tente novamente.';
          errorCode = 'INVALID_DATA';
        } else if (error.message.includes('500')) {
          errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
          errorCode = 'SERVER_ERROR';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Erro de autenticação. Entre em contato com o suporte.';
          errorCode = 'AUTH_ERROR';
        } else {
          // Usar a mensagem original se for específica e não contiver informações técnicas
          if (error.message.length < 100 && !error.message.includes('Error:') && !error.message.includes('at ')) {
            errorMessage = error.message;
          }
          errorCode = 'CUSTOM_ERROR';
        }
      }
      
      // Atualizar estado com erro
      setState(prev => ({
        ...prev,
        isLoading: false,
        isCreatingPayment: false,
        error: errorMessage
      }));

      // Mostrar erro com mensagem mais amigável
      toast.error(errorMessage);

      // Log do erro detalhado
      await auditService.logEvent({
        action: 'pix_payment_creation_error',
        details: {
          originalError: error instanceof Error ? error.message : String(error),
          userFriendlyError: errorMessage,
          errorCode: errorCode,
          planType: request.planType,
          isVip: request.isVip,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          stack: error instanceof Error ? error.stack : undefined
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