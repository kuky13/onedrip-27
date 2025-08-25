import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { MercadoPagoPlan, PaymentFlowState } from '../../shared/types/mercadoPago';
import { mercadoPagoService } from '../services/mercadoPagoService';
import MercadoPagoPlanCard from './MercadoPagoPlanCard';
import PaymentInstructionModal from './PaymentInstructionModal';

interface MercadoPagoCheckoutProps {
  className?: string;
}

const MercadoPagoCheckout: React.FC<MercadoPagoCheckoutProps> = ({ className = '' }) => {
  const [plans, setPlans] = useState<MercadoPagoPlan[]>([]);
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlowState>({
    selectedPlan: null,
    showInstructions: false,
    isProcessing: false,
    error: null
  });

  useEffect(() => {
    // Carregar planos do serviço
    const availablePlans = mercadoPagoService.getPlans();
    setPlans(availablePlans);

    // Auto-selecionar o plano mais popular
    const popularPlan = availablePlans.find(plan => plan.isPopular);
    if (popularPlan) {
      setPaymentFlow(prev => ({ ...prev, selectedPlan: popularPlan }));
    }
  }, []);

  const handlePlanSelect = (plan: MercadoPagoPlan) => {
    setPaymentFlow(prev => ({
      ...prev,
      selectedPlan: plan,
      error: null
    }));

    // Feedback visual
    toast.success(`${plan.name} selecionado!`, {
      description: `Valor: ${mercadoPagoService.formatPrice(plan.price)}`
    });
  };

  const handlePaymentClick = (plan: MercadoPagoPlan) => {
    if (!plan) {
      toast.error('Erro', {
        description: 'Nenhum plano selecionado. Tente novamente.'
      });
      return;
    }

    setPaymentFlow(prev => ({
      ...prev,
      selectedPlan: plan,
      showInstructions: true,
      error: null
    }));

    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'BRL',
        value: plan.price,
        items: [{
          item_id: plan.id,
          item_name: plan.name,
          category: 'subscription',
          quantity: 1,
          price: plan.price
        }]
      });
    }
  };

  const handlePaymentRedirect = (url: string) => {
    if (!paymentFlow.selectedPlan) return;

    setPaymentFlow(prev => ({ ...prev, isProcessing: true }));

    try {
      // Tracking do clique no pagamento
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'purchase_attempt', {
          currency: 'BRL',
          value: paymentFlow.selectedPlan.price,
          payment_method: 'mercado_pago',
          plan_type: paymentFlow.selectedPlan.planType
        });
      }

      // Feedback para o usuário
      toast.success('Redirecionando para o pagamento...', {
        description: 'Você será direcionado para o Mercado Pago em instantes.'
      });

      // Pequeno delay para melhor UX
      setTimeout(() => {
        window.open(url, '_blank');
        setPaymentFlow(prev => ({ ...prev, isProcessing: false }));
      }, 1000);

    } catch (error) {
      console.error('Erro ao redirecionar para pagamento:', error);
      setPaymentFlow(prev => ({
        ...prev,
        isProcessing: false,
        error: 'Erro ao processar pagamento. Tente novamente.'
      }));
      
      toast.error('Erro no pagamento', {
        description: 'Não foi possível redirecionar para o Mercado Pago. Tente novamente.'
      });
    }
  };

  const handleCloseModal = () => {
    setPaymentFlow(prev => ({
      ...prev,
      showInstructions: false,
      isProcessing: false,
      error: null
    }));
  };

  if (plans.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Error Display */}
      {paymentFlow.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{paymentFlow.error}</p>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {plans.map((plan) => (
          <MercadoPagoPlanCard
            key={plan.id}
            plan={plan}
            isSelected={paymentFlow.selectedPlan?.id === plan.id}
            onSelect={handlePlanSelect}
            onPaymentClick={handlePaymentClick}
          />
        ))}
      </div>

      {/* Selected Plan Summary */}
      {paymentFlow.selectedPlan && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Plano Selecionado: {paymentFlow.selectedPlan.name}
            </h3>
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {mercadoPagoService.formatPrice(paymentFlow.selectedPlan.price)}
              <span className="text-lg text-gray-600 font-normal">/{paymentFlow.selectedPlan.duration}</span>
            </p>
            {paymentFlow.selectedPlan.discount && (
              <p className="text-green-600 font-semibold">
                🎉 Você está economizando {paymentFlow.selectedPlan.discount}%!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Payment Instructions Modal */}
      <PaymentInstructionModal
        isOpen={paymentFlow.showInstructions}
        onClose={handleCloseModal}
        selectedPlan={paymentFlow.selectedPlan}
        onPaymentRedirect={handlePaymentRedirect}
      />

      {/* Processing Overlay */}
      {paymentFlow.isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Processando pagamento...</p>
            <p className="text-gray-500 text-sm mt-2">Aguarde um momento</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MercadoPagoCheckout;