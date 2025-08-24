// ============================================
// INTERFACE PRINCIPAL DE PAGAMENTO PIX
// ============================================
// Componente principal para gerenciar o fluxo completo de pagamento PIX

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle, XCircle, RefreshCw, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { PlanData, PixTransaction } from '../../../shared/types/pix';
import { usePixPayment } from '../../hooks/usePixPayment';
import { useTransactionStatus } from '../../hooks/useTransactionStatus';
import QRCodeDisplay from './QRCodeDisplay';

interface PixPaymentInterfaceProps {
  plan: PlanData;
  userEmail: string;
  onBack: () => void;
  onSuccess: (transaction: PixTransaction) => void;
  onCancel?: () => void;
  className?: string;
}

const PixPaymentInterface: React.FC<PixPaymentInterfaceProps> = ({
  plan,
  userEmail,
  onBack,
  onSuccess,
  onCancel,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState<'creating' | 'payment' | 'waiting'>('creating');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Hooks para pagamento e status
  const {
    createPayment,
    isLoading: isCreatingPayment,
    error: paymentError,
    clearError: clearPaymentError
  } = usePixPayment();

  const {
    transaction,
    isLoading: isCheckingStatus,
    error: statusError,
    refreshStatus,
    startMonitoring,
    stopMonitoring,
    getTimeRemaining
  } = useTransactionStatus(transactionId || '');

  // Criar pagamento PIX
  const handleCreatePayment = async () => {
    try {
      clearPaymentError();
      
      const newTransaction = await createPayment({
        planType: plan.type,
        planPeriod: plan.period,
        userEmail,
        amount: plan.price
      });

      setTransactionId(newTransaction.id);
      setCurrentStep('payment');
      
      // Iniciar monitoramento após um pequeno delay
      setTimeout(() => {
        startMonitoring();
        setCurrentStep('waiting');
      }, 1000);

    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      toast.error('Erro ao gerar código PIX. Tente novamente.');
    }
  };

  // Copiar código PIX
  const handleCopyPixCode = async () => {
    if (!transaction?.pixCode) return;

    try {
      await navigator.clipboard.writeText(transaction.pixCode);
      toast.success('Código PIX copiado!');
    } catch (error) {
      toast.error('Erro ao copiar código');
    }
  };

  // Baixar QR Code
  const handleDownloadQR = () => {
    if (!transaction?.qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = transaction.qrCodeUrl;
    link.download = `qr-code-pix-${transaction.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('QR Code baixado!');
  };

  // Cancelar transação
  const handleCancel = () => {
    stopMonitoring();
    onCancel?.();
  };

  // Efeito para monitorar mudanças de status
  useEffect(() => {
    if (transaction?.status === 'paid') {
      stopMonitoring();
      onSuccess(transaction);
    }
  }, [transaction, stopMonitoring, onSuccess]);

  // Efeito para iniciar criação do pagamento
  useEffect(() => {
    if (currentStep === 'creating') {
      handleCreatePayment();
    }
  }, [currentStep]);

  // Calcular tempo restante
  const timeRemaining = getTimeRemaining();

  // Renderizar loading inicial
  if (currentStep === 'creating' || isCreatingPayment) {
    return (
      <div className={`max-w-md mx-auto ${className}`}>
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gerando código PIX...
            </h3>
            <p className="text-gray-600">
              Aguarde enquanto preparamos seu pagamento
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar erro
  if (paymentError) {
    return (
      <div className={`max-w-md mx-auto ${className}`}>
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erro ao gerar PIX
            </h3>
            <p className="text-gray-600 mb-6">
              {paymentError}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onBack}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  clearPaymentError();
                  setCurrentStep('creating');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar interface de pagamento
  if (!transaction) {
    return null;
  }

  return (
    <div className={`max-w-lg mx-auto ${className}`}>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold">Pagamento PIX</h2>
            <div className="w-9" /> {/* Spacer */}
          </div>
          
          {/* Status */}
          <div className="flex items-center justify-center space-x-2">
            {transaction.status === 'pending' && (
              <>
                <Clock className="w-5 h-5" />
                <span>Aguardando pagamento</span>
              </>
            )}
            {transaction.status === 'paid' && (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Pagamento confirmado</span>
              </>
            )}
            {transaction.status === 'expired' && (
              <>
                <XCircle className="w-5 h-5" />
                <span>Código expirado</span>
              </>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {/* Informações do plano */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Plano:</span>
              <span className="font-semibold">{plan.name}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Período:</span>
              <span className="font-semibold">
                {plan.period === 'monthly' ? 'Mensal' : 'Anual'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Valor:</span>
              <span className="font-bold text-lg text-green-600">
                R$ {plan.price.toFixed(2)}
              </span>
            </div>
          </div>

          {/* QR Code e código PIX */}
          {transaction.status === 'pending' && (
            <>
              <QRCodeDisplay
                qrCodeUrl={transaction.qrCodeUrl}
                pixCode={transaction.pixCode}
                onCopyCode={handleCopyPixCode}
                onDownloadQR={handleDownloadQR}
              />

              {/* Timer */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="text-yellow-800 font-medium">
                      Tempo restante:
                    </span>
                  </div>
                  <div className="text-yellow-800 font-mono font-bold">
                    {timeRemaining.isExpired ? (
                      'Expirado'
                    ) : (
                      `${timeRemaining.hours.toString().padStart(2, '0')}:${timeRemaining.minutes.toString().padStart(2, '0')}:${timeRemaining.seconds.toString().padStart(2, '0')}`
                    )}
                  </div>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  O código PIX expira em 24 horas. Após esse período, será necessário gerar um novo código.
                </p>
              </div>

              {/* Instruções */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-900">
                  Como pagar com PIX:
                </h4>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">
                      1
                    </span>
                    <span>Abra o app do seu banco ou carteira digital</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">
                      2
                    </span>
                    <span>Escaneie o QR Code ou cole o código PIX</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">
                      3
                    </span>
                    <span>Confirme o pagamento</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">
                      4
                    </span>
                    <span>Aguarde a confirmação automática</span>
                  </li>
                </ol>
              </div>
            </>
          )}

          {/* Status de verificação */}
          {currentStep === 'waiting' && transaction.status === 'pending' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    Verificando pagamento...
                  </p>
                  <p className="text-sm text-blue-700">
                    Assim que o pagamento for confirmado, você será redirecionado automaticamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex space-x-3">
            {transaction.status === 'pending' && (
              <>
                <button
                  onClick={refreshStatus}
                  disabled={isCheckingStatus}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                  <span>Verificar status</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </>
            )}
            
            {transaction.status === 'expired' && (
              <>
                <button
                  onClick={onBack}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={() => {
                    setCurrentStep('creating');
                    setTransactionId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Gerar novo código
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixPaymentInterface;