import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, Clock, AlertCircle, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { checkPaymentStatus, type PixPreferenceResponse, type PaymentStatus } from '@/services/paymentService';
import QRCodeLib from 'qrcode';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PixPreferenceResponse;
  onPaymentSuccess: () => void;
}

const PixPaymentModal: React.FC<PixPaymentModalProps> = ({
  isOpen,
  onClose,
  paymentData,
  onPaymentSuccess
}) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [pixCode, setPixCode] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Calcular tempo restante
  useEffect(() => {
    if (!paymentData?.expires_at) return;

    const updateTimer = () => {
      const expiresAt = new Date(paymentData.expires_at).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, expiresAt - now);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        toast.error('Pagamento expirado');
        onClose();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [paymentData?.expires_at, onClose]);

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (!isOpen || !paymentData?.transaction_id) return;

    const checkStatus = async () => {
      try {
        setIsCheckingStatus(true);
        const status = await checkPaymentStatus(paymentData.transaction_id);
        setPaymentStatus(status);

        if (status.status === 'approved') {
          toast.success('Pagamento aprovado!');
          onPaymentSuccess();
          onClose();
        } else if (status.status === 'rejected') {
          toast.error('Pagamento rejeitado');
          onClose();
        } else if (status.status === 'expired') {
          toast.error('Pagamento expirado');
          onClose();
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    // Verificar imediatamente
    checkStatus();

    // Verificar a cada 5 segundos
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [isOpen, paymentData?.transaction_id, onPaymentSuccess, onClose]);

  // Gerar código PIX e QR Code
  useEffect(() => {
    const generateQRCode = async (code: string) => {
      try {
        const dataUrl = await QRCodeLib.toDataURL(code, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeDataUrl(dataUrl);
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
      }
    };

    if (paymentData?.qr_code) {
      setPixCode(paymentData.qr_code);
      generateQRCode(paymentData.qr_code);
    } else {
      // Código PIX simulado para desenvolvimento
      const simulatedPixCode = `00020126580014br.gov.bcb.pix0136${paymentData?.transaction_id || 'sim-' + Date.now()}5204000053039865802BR5925OneDrip Blueberry LTDA6009SAO PAULO62070503***6304${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      setPixCode(simulatedPixCode);
      generateQRCode(simulatedPixCode);
    }
  }, [paymentData]);

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      toast.success('Código PIX copiado!');
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Erro ao copiar código PIX');
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    if (isCheckingStatus) return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
    
    switch (paymentStatus?.status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    if (isCheckingStatus) return 'Verificando pagamento...';
    
    switch (paymentStatus?.status) {
      case 'approved':
        return 'Pagamento aprovado!';
      case 'rejected':
        return 'Pagamento rejeitado';
      case 'expired':
        return 'Pagamento expirado';
      case 'pending':
        return 'Aguardando pagamento';
      default:
        return 'Processando...';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Pagamento PIX</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-center space-x-2 p-4 bg-gray-50 rounded-lg">
            {getStatusIcon()}
            <span className="font-medium text-gray-900">{getStatusText()}</span>
          </div>

          {/* Timer */}
          {timeRemaining > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Tempo restante para pagamento:</p>
              <p className="text-2xl font-bold text-red-600">{formatTime(timeRemaining)}</p>
            </div>
          )}

          {/* Valor */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Valor a pagar:</p>
            <p className="text-3xl font-bold text-blue-600">
              R$ {paymentData.amount.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {/* QR Code */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-64 h-64 bg-white border border-gray-200 rounded-lg mb-4 p-4">
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code PIX" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm text-gray-500">Gerando QR Code...</p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Escaneie o QR Code com o app do seu banco ou copie o código abaixo
            </p>
          </div>

          {/* Código PIX */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Código PIX (Copia e Cola):
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={pixCode}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={copyPixCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar</span>
              </button>
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">Como pagar:</h3>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Abra o app do seu banco</li>
              <li>Escolha a opção PIX</li>
              <li>Escaneie o QR Code ou cole o código</li>
              <li>Confirme o pagamento</li>
              <li>Aguarde a confirmação automática</li>
            </ol>
          </div>

          {/* Informações da transação */}
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>ID da Transação:</strong> {paymentData.transaction_id}</p>
            <p><strong>Preferência:</strong> {paymentData.preference_id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixPaymentModal;