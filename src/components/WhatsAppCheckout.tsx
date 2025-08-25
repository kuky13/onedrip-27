import React, { useState, useEffect } from 'react';
import { MessageCircle, Check, Star, Zap, Shield, Clock, ArrowRight, Gift } from 'lucide-react';
import {
  WhatsAppPlan,
  WhatsAppCheckoutProps,
  CustomerData
} from '../../shared/types/whatsappSales';
import { whatsappSalesService } from '../services/whatsappSalesService';
import { generatePlanInfoMessage } from '../utils/whatsappTemplates';
import { createWhatsAppUrl } from '../utils/whatsapp';

const WhatsAppCheckout: React.FC<WhatsAppCheckoutProps> = ({
  plans,
  selectedPlan,
  onPlanSelect,
  onCheckout,
  loading = false
}) => {
  const [showContactForm, setShowContactForm] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CustomerData>>({});

  // Auto-select popular plan on mount
  useEffect(() => {
    if (!selectedPlan && plans.length > 0) {
      const popularPlan = plans.find(plan => plan.isPopular) || plans[0];
      onPlanSelect(popularPlan);
    }
  }, [plans, selectedPlan, onPlanSelect]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerData> = {};

    if (!customerData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(customerData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Telefone inválido';
    }

    if (customerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlanSelect = (plan: WhatsAppPlan) => {
    onPlanSelect(plan);
    setShowContactForm(false);
  };

  const handleQuickContact = async () => {
    if (!selectedPlan) return;

    try {
      setIsSubmitting(true);
      
      // Track conversion
      await whatsappSalesService.trackConversion({
        planId: selectedPlan.id,
        customerPhone: 'quick_contact',
        source: 'checkout_quick'
      });

      // Generate WhatsApp message
      const message = generatePlanInfoMessage(selectedPlan);
      const config = whatsappSalesService.getConfig();
      const whatsappUrl = createWhatsAppUrl(config.businessPhone, message);
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error in quick contact:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedPlan) return;

    try {
      setIsSubmitting(true);
      
      const result = await whatsappSalesService.createSale({
        planId: selectedPlan.id,
        customerPhone: customerData.phone,
        customerName: customerData.name,
        customerEmail: customerData.email,
        source: 'checkout_form',
        notes: customerData.notes
      });

      if (result.success && result.whatsappUrl) {
        onCheckout(selectedPlan.id, customerData);
        window.open(result.whatsappUrl, '_blank');
        setShowContactForm(false);
        setCustomerData({ name: '', phone: '', email: '', notes: '' });
      } else {
        alert(result.error || 'Erro ao processar solicitação');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Erro interno. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Escolha o Plano Ideal para seu Negócio
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Transforme seu negócio com nossas soluções de automação. 
          Entre em contato via WhatsApp e receba atendimento personalizado!
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => {
          const isSelected = selectedPlan?.id === plan.id;
          const isPopular = plan.isPopular;
          
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                isSelected
                  ? 'border-blue-500 shadow-2xl bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 bg-white'
              } ${isPopular ? 'ring-4 ring-blue-100' : ''}`}
              onClick={() => handlePlanSelect(plan)}
            >
              {/* Popular Badge */}
              {isPopular && (
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
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Section */}
      {selectedPlan && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pronto para começar com o {selectedPlan.name}?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Entre em contato via WhatsApp e receba atendimento personalizado!
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Quick Contact Button */}
              <button
                onClick={handleQuickContact}
                disabled={isSubmitting}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                <MessageCircle className="w-6 h-6" />
                {isSubmitting ? 'Conectando...' : 'Falar no WhatsApp'}
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Detailed Contact Button */}
              <button
                onClick={() => setShowContactForm(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105"
              >
                <Shield className="w-6 h-6" />
                Contato Personalizado
              </button>
            </div>

            {/* Benefits */}
            <div className="grid sm:grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-yellow-500" />
                <div>
                  <div className="font-semibold text-gray-900">Resposta Rápida</div>
                  <div className="text-sm text-gray-600">Em até 5 minutos</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Gift className="w-8 h-8 text-purple-500" />
                <div>
                  <div className="font-semibold text-gray-900">Consultoria Grátis</div>
                  <div className="text-sm text-gray-600">30 dias inclusos</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="font-semibold text-gray-900">Suporte 24/7</div>
                  <div className="text-sm text-gray-600">Sempre disponível</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Vamos conversar sobre o {selectedPlan?.name}!
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome (opcional)
                </label>
                <input
                  type="text"
                  value={customerData.name}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp *
                </label>
                <input
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="(11) 99999-9999"
                  required
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem (opcional)
                </label>
                <textarea
                  value={customerData.notes}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Conte-nos mais sobre seu negócio..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <MessageCircle className="w-5 h-5" />
                  )}
                  {isSubmitting ? 'Enviando...' : 'Enviar WhatsApp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppCheckout;