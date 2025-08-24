// ============================================
// COMPONENTE SELETOR DE PAGAMENTO PIX
// ============================================
// Componente para seleção entre PIX e outros métodos de pagamento

import React from 'react';
import { QrCode, CreditCard, Smartphone, Clock, Shield, Zap } from 'lucide-react';
import type { PlanData } from '../../../shared/types/pix';

interface PixSelectorProps {
  plan: PlanData;
  selectedMethod: 'pix' | 'mercadopago';
  onMethodChange: (method: 'pix' | 'mercadopago') => void;
  className?: string;
}

const PixSelector: React.FC<PixSelectorProps> = ({
  plan,
  selectedMethod,
  onMethodChange,
  className = ''
}) => {
  const pixBenefits = [
    {
      icon: <Zap className="w-4 h-4" />,
      text: 'Pagamento instantâneo'
    },
    {
      icon: <Shield className="w-4 h-4" />,
      text: 'Seguro e confiável'
    },
    {
      icon: <Clock className="w-4 h-4" />,
      text: 'Disponível 24h'
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Título */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Escolha sua forma de pagamento
        </h3>
        <p className="text-sm text-gray-600">
          Selecione o método que preferir para o plano {plan.name}
        </p>
      </div>

      {/* Opções de pagamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Opção PIX */}
        <div
          className={`
            relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
            ${selectedMethod === 'pix'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }
          `}
          onClick={() => onMethodChange('pix')}
        >
          {/* Badge de recomendado */}
          {selectedMethod === 'pix' && (
            <div className="absolute -top-2 left-4 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              Recomendado
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`
                p-2 rounded-lg
                ${selectedMethod === 'pix' ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                <QrCode className={`w-6 h-6 ${
                  selectedMethod === 'pix' ? 'text-blue-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">PIX</h4>
                <p className="text-sm text-gray-600">Pagamento instantâneo</p>
              </div>
            </div>
            
            {/* Radio button */}
            <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center
              ${selectedMethod === 'pix'
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
              }
            `}>
              {selectedMethod === 'pix' && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
          </div>

          {/* Benefícios */}
          <div className="space-y-2">
            {pixBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div className={`
                  ${selectedMethod === 'pix' ? 'text-blue-600' : 'text-gray-500'}
                `}>
                  {benefit.icon}
                </div>
                <span className={`
                  ${selectedMethod === 'pix' ? 'text-gray-700' : 'text-gray-600'}
                `}>
                  {benefit.text}
                </span>
              </div>
            ))}
          </div>

          {/* Preço */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Valor:</span>
              <span className="font-semibold text-lg text-gray-900">
                R$ {plan.price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Opção Mercado Pago */}
        <div
          className={`
            relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
            ${selectedMethod === 'mercadopago'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }
          `}
          onClick={() => onMethodChange('mercadopago')}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`
                p-2 rounded-lg
                ${selectedMethod === 'mercadopago' ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                <CreditCard className={`w-6 h-6 ${
                  selectedMethod === 'mercadopago' ? 'text-blue-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Mercado Pago</h4>
                <p className="text-sm text-gray-600">Cartão e outros métodos</p>
              </div>
            </div>
            
            {/* Radio button */}
            <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center
              ${selectedMethod === 'mercadopago'
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
              }
            `}>
              {selectedMethod === 'mercadopago' && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
          </div>

          {/* Métodos disponíveis */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <CreditCard className={`w-4 h-4 ${
                selectedMethod === 'mercadopago' ? 'text-blue-600' : 'text-gray-500'
              }`} />
              <span className={`
                ${selectedMethod === 'mercadopago' ? 'text-gray-700' : 'text-gray-600'}
              `}>
                Cartão de crédito/débito
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Smartphone className={`w-4 h-4 ${
                selectedMethod === 'mercadopago' ? 'text-blue-600' : 'text-gray-500'
              }`} />
              <span className={`
                ${selectedMethod === 'mercadopago' ? 'text-gray-700' : 'text-gray-600'}
              `}>
                Carteira digital
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <QrCode className={`w-4 h-4 ${
                selectedMethod === 'mercadopago' ? 'text-blue-600' : 'text-gray-500'
              }`} />
              <span className={`
                ${selectedMethod === 'mercadopago' ? 'text-gray-700' : 'text-gray-600'}
              `}>
                PIX via Mercado Pago
              </span>
            </div>
          </div>

          {/* Preço */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Valor:</span>
              <span className="font-semibold text-lg text-gray-900">
                R$ {plan.price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h5 className="font-medium text-gray-900 mb-1">
              Pagamento 100% seguro
            </h5>
            <p className="text-sm text-gray-600">
              Seus dados estão protegidos com criptografia de ponta a ponta.
              {selectedMethod === 'pix' 
                ? ' O PIX é regulamentado pelo Banco Central do Brasil.'
                : ' Processamento seguro via Mercado Pago.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixSelector;