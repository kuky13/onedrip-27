import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Loader2, CreditCard, Crown } from 'lucide-react';
import { redirectToPayment } from '../../services/paymentService';
import { PLANS_CONTENT } from '../data/content';
import { PixSelector, PixPaymentInterface } from '@/components/pix';
import type { PlanType } from '../../../shared/types/pix';

interface DadosPlano {
  nome: string;
  descricao: string;
  preco: number;
  preco_original?: number;
  moeda: string;
  periodo: string;
  ciclo: 'monthly' | 'yearly';
  badge_popular: string;
  mostrar_badge: boolean;
  botao_texto: string;
  mostrar_suporte: boolean;
  texto_suporte: string;
  informacoes_extras: string;
  beneficios: string[];
}

interface PlanCardProps {
  plano: DadosPlano;
  aoSelecionarPlano?: () => void; // Manter compatibilidade
  isVip?: boolean;
  userEmail?: string;
  onVipToggle?: (isVip: boolean) => void;
  isProcessing?: boolean;
}

export const PlanCard = ({ plano, aoSelecionarPlano, isVip = false, userEmail = 'user@example.com', onVipToggle, isProcessing = false }: PlanCardProps) => {
  const [loading, setLoading] = useState(false);
  const [vipSelected, setVipSelected] = useState(isVip);
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'pix'>('mercadopago');
  const [showPixPayment, setShowPixPayment] = useState(false);
  const vipData = PLANS_CONTENT.vip;

  const handleVipToggle = (checked: boolean) => {
    setVipSelected(checked);
    if (onVipToggle) {
      onVipToggle(checked);
    }
  };

  const calculateTotalPrice = () => {
    const basePrice = plano.preco;
    const vipPrice = vipSelected ? vipData.preco_adicional : 0;
    return basePrice + vipPrice;
  };

  const handlePayment = () => {
    setLoading(true);
    try {
      if (paymentMethod === 'pix') {
        setShowPixPayment(true);
      } else {
        redirectToPayment(
          plano.ciclo, // 'monthly' ou 'yearly'
          vipSelected // Usar vipSelected em vez de isVip prop
        );
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getPlanType = (): PlanType => {
    return plano.ciclo === 'monthly' ? 'monthly' : 'yearly';
  };

  const handlePixPaymentClose = () => {
    setShowPixPayment(false);
    setLoading(false);
  };

  const handleButtonClick = () => {
    if (aoSelecionarPlano) {
      // Usar função original se fornecida (compatibilidade)
      aoSelecionarPlano();
    } else {
      // Usar nova função de pagamento
      handlePayment();
    }
  };

  return (
    <section className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
      <div className="max-w-md mx-auto">
        <div className="relative bg-card border border-border rounded-3xl p-8 glass backdrop-blur-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl">
          
          {/* Badge Popular */}
          {plano.mostrar_badge && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">
                {plano.badge_popular}
              </span>
            </div>
          )}
          
          {/* Cabeçalho do Plano */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {plano.nome}
            </h3>
            <p className="text-muted-foreground mb-6">
              {plano.descricao}
            </p>
            
            {/* Preço */}
            <div className="flex flex-col items-center justify-center mb-6">
              {plano.preco_original && (
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg text-muted-foreground line-through">
                    {plano.moeda}{plano.preco_original.toFixed(2)}
                  </span>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                    {Math.round(((plano.preco_original - plano.preco) / plano.preco_original) * 100)}% OFF
                  </span>
                </div>
              )}
              <div className="flex items-baseline justify-center">
                <span className="text-5xl font-bold text-foreground">
                  {plano.moeda}{calculateTotalPrice().toFixed(2)}
                </span>
                <span className="text-xl text-muted-foreground ml-1">
                  {plano.periodo}
                </span>
              </div>
              {vipSelected && (
                <div className="flex items-center space-x-1 mt-2">
                  <span className="text-sm text-muted-foreground">
                    Base: {plano.moeda}{plano.preco.toFixed(2)}
                  </span>
                  <span className="text-sm text-primary font-medium">
                    + VIP: {plano.moeda}{vipData.preco_adicional.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Lista de Benefícios */}
          <div className="space-y-4 mb-6">
            {plano.beneficios.map((beneficio, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{beneficio}</span>
              </div>
            ))}
          </div>

          {/* Upgrade VIP */}
          <div className={`mb-6 p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
            vipSelected 
              ? 'border-primary bg-gradient-to-br from-primary/10 to-accent/5' 
              : 'border-border hover:border-primary/50'
          }`} onClick={() => handleVipToggle(!vipSelected)}>
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={vipSelected}
                onCheckedChange={handleVipToggle}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className={`h-5 w-5 ${
                    vipSelected ? 'text-primary' : 'text-primary/80'
                  }`} />
                  <span className="font-semibold text-foreground">
                    {vipData.nome}
                  </span>
                  <span className="text-sm font-bold text-primary">
                    +{vipData.moeda}{vipData.preco_adicional.toFixed(2)}{plano.periodo}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {vipData.descricao}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {vipData.beneficios.slice(0, 3).map((beneficio, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-xs text-foreground">{beneficio}</span>
                    </div>
                  ))}
                  {vipData.beneficios.length > 3 && (
                    <div className="flex items-center space-x-2">
                      <Crown className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-xs text-primary font-medium">
                        +{vipData.beneficios.length - 3} benefícios adicionais
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Seletor de Método de Pagamento */}
          <div className="mb-6">
            <PixSelector
              plan={{
                id: `plan-${plano.nome.toLowerCase().replace(/\s+/g, '-')}`,
                name: plano.nome,
                type: getPlanType(),
                price: calculateTotalPrice(),
                currency: 'BRL',
                period: plano.periodo,
                isVip: vipSelected
              }}
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
            />
          </div>

          {/* Botão de Ação */}
          <Button 
            onClick={handleButtonClick}
            disabled={loading || isProcessing}
            className={`w-full text-lg py-4 mb-4 transition-all duration-300 ${
              vipSelected 
                ? 'btn-premium bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90' 
                : 'btn-premium'
            }`}
          >
            {(loading || isProcessing) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {vipSelected ? (
                  <Crown className="mr-2 h-4 w-4" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                {paymentMethod === 'pix' ? 'Pagar com PIX' : (vipSelected ? `${plano.botao_texto} VIP` : plano.botao_texto)}
              </>
            )}
          </Button>

          {/* Interface de Pagamento PIX */}
          {showPixPayment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <PixPaymentInterface
                  planType={getPlanType()}
                  isVip={vipSelected}
                  userEmail={userEmail}
                  onClose={handlePixPaymentClose}
                  onSuccess={() => {
                    handlePixPaymentClose();
                    // Aqui você pode adicionar lógica adicional de sucesso
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Informações de Suporte */}
          {plano.mostrar_suporte && (
            <p className="text-center text-sm text-muted-foreground mb-4">
              {plano.texto_suporte}
            </p>
          )}
          
          {/* Informações Extras */}
          <p className="text-center text-xs text-muted-foreground">
            {plano.informacoes_extras}
          </p>
        </div>
      </div>
    </section>
  );
};