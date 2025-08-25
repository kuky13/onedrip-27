import React from 'react';
import { Check, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MercadoPagoPlan } from '../../shared/types/mercadoPago';
import { mercadoPagoService } from '../services/mercadoPagoService';

interface MercadoPagoPlanCardProps {
  plan: MercadoPagoPlan;
  isSelected: boolean;
  onSelect: (plan: MercadoPagoPlan) => void;
  onPaymentClick: (plan: MercadoPagoPlan) => void;
}

const MercadoPagoPlanCard: React.FC<MercadoPagoPlanCardProps> = ({
  plan,
  isSelected,
  onSelect,
  onPaymentClick
}) => {
  const formatPrice = (price: number) => {
    return mercadoPagoService.formatPrice(price);
  };

  const handleCardClick = () => {
    onSelect(plan);
  };

  const handlePaymentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPaymentClick(plan);
  };

  return (
    <div
      className={`relative rounded-2xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
        isSelected
          ? 'border-blue-500 shadow-2xl bg-blue-50'
          : 'border-gray-200 hover:border-blue-300 bg-white'
      } ${plan.isPopular ? 'ring-4 ring-blue-100' : ''}`}
      onClick={handleCardClick}
    >
      {/* Popular Badge */}
      {plan.isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
            <Star className="w-4 h-4" />
            Mais Popular
          </div>
        </div>
      )}

      {/* Discount Badge */}
      {plan.discount && (
        <div className="absolute top-4 right-4">
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            -{plan.discount}%
          </div>
        </div>
      )}

      <div className="p-8">
        {/* Plan Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          <p className="text-gray-600 mb-4">{plan.description}</p>
          
          {/* Pricing */}
          <div className="mb-4">
            {plan.originalPrice && (
              <div className="text-lg text-gray-400 line-through mb-1">
                {formatPrice(plan.originalPrice)}
              </div>
            )}
            <div className="text-4xl font-bold text-gray-900">
              {formatPrice(plan.price)}
              <span className="text-lg text-gray-600 font-normal">/{plan.duration}</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold mb-4">
            <Check className="w-5 h-5" />
            Plano Selecionado
          </div>
        )}

        {/* Payment Button */}
        <Button
          onClick={handlePaymentClick}
          className={`w-full py-3 text-lg font-semibold transition-all duration-300 ${
            isSelected
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {isSelected ? (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Comprar Agora
            </>
          ) : (
            'Selecionar Plano'
          )}
        </Button>
      </div>
    </div>
  );
};

export default MercadoPagoPlanCard;