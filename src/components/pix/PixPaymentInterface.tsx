// ============================================
// INTERFACE SIMPLIFICADA DE PAGAMENTO PIX
// ============================================
// Componente simplificado para mostrar o sistema PIX

import React from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import type { PlanData } from '../../../shared/types/pix';

interface PixPaymentInterfaceProps {
  plan: PlanData;
  userEmail: string;
  onBack: () => void;
  onSuccess: (transaction: any) => void;
  onCancel?: () => void;
  className?: string;
}

const PixPaymentInterface: React.FC<PixPaymentInterfaceProps> = ({
  plan,
  userEmail,
  onBack,
  className = ''
}) => {
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
                {plan.type === 'monthly' ? 'Mensal' : 'Anual'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Valor:</span>
              <span className="font-bold text-lg text-green-600">
                R$ {plan.price.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Mensagem de configuração */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">
                  Sistema PIX não configurado
                </h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Para ativar os pagamentos PIX, você precisa configurar suas credenciais do Mercado Pago.
                </p>
                <div className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded font-mono">
                  <p>Adicione no arquivo .env:</p>
                  <p>VITE_MERCADO_PAGO_ACCESS_TOKEN=seu_token_aqui</p>
                  <p>VITE_MERCADO_PAGO_PUBLIC_KEY=sua_chave_aqui</p>
                </div>
              </div>
            </div>
          </div>

          {/* Como configurar */}
          <div className="space-y-4 mb-6">
            <h4 className="font-semibold text-gray-900">
              Como configurar o sistema PIX:
            </h4>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">
                  1
                </span>
                <span>Acesse sua conta no Mercado Pago Developers</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">
                  2
                </span>
                <span>Crie uma aplicação e copie as credenciais</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">
                  3
                </span>
                <span>Adicione as variáveis no arquivo .env do projeto</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mt-0.5">
                  4
                </span>
                <span>Reinicie o servidor e teste novamente</span>
              </li>
            </ol>
          </div>

          {/* Botão voltar */}
          <button
            onClick={onBack}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Voltar aos planos
          </button>
        </div>
      </div>
    </div>
  );
};

export default PixPaymentInterface;