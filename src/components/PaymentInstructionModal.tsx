import React from 'react';
import { X, CreditCard, MessageCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MercadoPagoPlan } from '../../shared/types/mercadoPago';
import { mercadoPagoService } from '../services/mercadoPagoService';

interface PaymentInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: MercadoPagoPlan | null;
  onPaymentRedirect: (url: string) => void;
}

const PaymentInstructionModal: React.FC<PaymentInstructionModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  onPaymentRedirect
}) => {
  if (!isOpen || !selectedPlan) return null;

  const handlePaymentRedirect = () => {
    onPaymentRedirect(selectedPlan.mercadoPagoUrl);
    mercadoPagoService.redirectToPayment(selectedPlan);
  };

  const handleWhatsAppRedirect = () => {
    mercadoPagoService.openWhatsAppForProof(selectedPlan);
  };

  const formattedPrice = mercadoPagoService.formatPrice(selectedPlan.price);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Instruções de Pagamento</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Plan Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Plano Selecionado:</h3>
          <p className="text-blue-800">{selectedPlan.name}</p>
          <p className="text-2xl font-bold text-blue-900">{formattedPrice}</p>
          {selectedPlan.discount && (
            <p className="text-sm text-green-600 font-semibold">
              Economia de {selectedPlan.discount}% aplicada!
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 rounded-full p-2 mt-1">
              <span className="text-blue-600 font-bold text-sm">1</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Realize o Pagamento</h4>
              <p className="text-gray-600">Clique no botão abaixo para ser redirecionado ao Mercado Pago e efetue o pagamento do {selectedPlan.name}.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-green-100 rounded-full p-2 mt-1">
              <span className="text-green-600 font-bold text-sm">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Envie o Comprovante</h4>
              <p className="text-gray-600">
                Após o pagamento, envie o comprovante para nosso WhatsApp 
                <span className="font-semibold text-blue-600"> (número final 22)</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Número completo: {mercadoPagoService.getWhatsAppNumber()}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-purple-100 rounded-full p-2 mt-1">
              <span className="text-purple-600 font-bold text-sm">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Ativação Imediata</h4>
              <p className="text-gray-600">Seu acesso será liberado em até 5 minutos após a confirmação do pagamento.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handlePaymentRedirect}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold transition-all duration-300 hover:scale-105"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Pagar {formattedPrice}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          
          <Button
            onClick={handleWhatsAppRedirect}
            variant="outline"
            className="flex-1 border-green-500 text-green-600 hover:bg-green-50 py-3 text-lg font-semibold transition-all duration-300 hover:scale-105"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Enviar Comprovante
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Pagamento 100% seguro via Mercado Pago</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Suporte via WhatsApp disponível 24/7</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              <strong>Garantia:</strong> Caso tenha algum problema com o pagamento, 
              entre em contato conosco pelo WhatsApp. Estamos aqui para ajudar!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentInstructionModal;