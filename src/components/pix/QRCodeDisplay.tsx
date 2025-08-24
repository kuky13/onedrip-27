// ============================================
// COMPONENTE DISPLAY DE QR CODE PIX
// ============================================
// Componente para exibir QR Code e código PIX com funcionalidades de cópia e download

import React, { useState } from 'react';
import { Copy, Download, QrCode, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  qrCodeUrl: string;
  pixCode: string;
  onCopyCode: () => void;
  onDownloadQR: () => void;
  className?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  qrCodeUrl,
  pixCode,
  onCopyCode,
  onDownloadQR,
  className = ''
}) => {
  const [showFullCode, setShowFullCode] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Mascarar código PIX para exibição
  const getMaskedCode = (code: string) => {
    if (showFullCode) return code;
    if (code.length <= 20) return code;
    return `${code.substring(0, 10)}...${code.substring(code.length - 10)}`;
  };

  // Copiar código PIX
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      onCopyCode();
    } catch (error) {
      // Fallback para navegadores que não suportam clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = pixCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      onCopyCode();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* QR Code */}
      <div className="text-center">
        <h4 className="font-semibold text-gray-900 mb-4">
          Escaneie o QR Code
        </h4>
        
        <div className="relative inline-block">
          {/* Container do QR Code */}
          <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-sm">
            {!imageError ? (
              <>
                {/* Loading placeholder */}
                {!imageLoaded && (
                  <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                )}
                
                {/* QR Code Image */}
                <img
                  src={qrCodeUrl}
                  alt="QR Code PIX"
                  className={`w-48 h-48 rounded-lg ${imageLoaded ? 'block' : 'hidden'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true);
                    toast.error('Erro ao carregar QR Code');
                  }}
                />
              </>
            ) : (
              /* Fallback quando há erro na imagem */
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500">
                <QrCode className="w-12 h-12 mb-2" />
                <p className="text-sm text-center">
                  QR Code temporariamente
                  <br />
                  indisponível
                </p>
              </div>
            )}
          </div>

          {/* Botão de download */}
          {imageLoaded && !imageError && (
            <button
              onClick={onDownloadQR}
              className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
              title="Baixar QR Code"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-sm text-gray-600 mt-3">
          Use a câmera do seu celular ou app do banco
        </p>
      </div>

      {/* Divisor */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">ou</span>
        </div>
      </div>

      {/* Código PIX */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4 text-center">
          Copie o código PIX
        </h4>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          {/* Header do código */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Código PIX:
            </span>
            <button
              onClick={() => setShowFullCode(!showFullCode)}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              {showFullCode ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Ocultar</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Ver completo</span>
                </>
              )}
            </button>
          </div>

          {/* Código PIX */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
            <code className="text-sm text-gray-800 break-all font-mono leading-relaxed">
              {getMaskedCode(pixCode)}
            </code>
          </div>

          {/* Botão de copiar */}
          <button
            onClick={handleCopyCode}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Copy className="w-4 h-4" />
            <span>Copiar código PIX</span>
          </button>
        </div>

        {/* Instruções */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">
            💡 Como usar o código PIX:
          </h5>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Abra o app do seu banco</li>
            <li>2. Escolha a opção "PIX" ou "Transferir"</li>
            <li>3. Selecione "Pix Copia e Cola"</li>
            <li>4. Cole o código copiado</li>
            <li>5. Confirme o pagamento</li>
          </ol>
        </div>
      </div>

      {/* Informações de segurança */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="bg-green-100 rounded-full p-1">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h5 className="font-medium text-green-900 mb-1">
              Pagamento seguro
            </h5>
            <p className="text-sm text-green-800">
              Este código PIX é único e válido apenas para esta transação. 
              Seus dados estão protegidos com criptografia de ponta a ponta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;