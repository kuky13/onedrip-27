import { MercadoPagoPlan, MercadoPagoConfig } from '../../shared/types/mercadoPago';

class MercadoPagoService {
  private config: MercadoPagoConfig = {
    plans: {
      monthly: 'https://mpago.li/2ZqAPDs',
      monthly_premium: 'https://mpago.li/2A351iP',
      annual: 'https://mpago.li/1c4LGhc',
      annual_vip: 'https://mpago.li/1x254ne'
    },
    whatsappNumber: '556496028022'
  };

  private plans: MercadoPagoPlan[] = [
    {
      id: 'monthly',
      name: 'Plano Mensal',
      description: 'Ideal para começar',
      price: 68.90,
      duration: 'mês',
      planType: 'monthly',
      mercadoPagoUrl: this.config.plans.monthly,
      features: [
        'Sistema completo de orçamentos',
        'Gestão de clientes ilimitada',
        'Cálculos automáticos',
        'Controle de dispositivos',
        'Suporte técnico incluso',
        'Atualizações gratuitas'
      ]
    },
    {
      id: 'monthly_premium',
      name: 'Plano Mensal + Premium',
      description: 'Recursos avançados inclusos',
      price: 89.90,
      duration: 'mês',
      planType: 'monthly_premium',
      mercadoPagoUrl: this.config.plans.monthly_premium,
      isPopular: true,
      features: [
        'Tudo do Plano Mensal',
        'Relatórios avançados',
        'Integração com WhatsApp',
        'Templates personalizados',
        'Backup automático na nuvem',
        'Suporte prioritário',
        'Treinamento personalizado'
      ]
    },
    {
      id: 'annual',
      name: 'Plano Anual',
      description: 'Economia de 30%',
      price: 490.00,
      originalPrice: 826.80,
      discount: 40,
      duration: 'ano',
      planType: 'annual',
      mercadoPagoUrl: this.config.plans.annual,
      features: [
        'Sistema completo de orçamentos',
        'Gestão de clientes ilimitada',
        'Cálculos automáticos',
        'Controle de dispositivos',
        'Suporte técnico incluso',
        'Atualizações gratuitas',
        '12 meses pelo preço de 8'
      ]
    },
    {
      id: 'annual_vip',
      name: 'Plano Anual + VIP',
      description: 'Máximo de recursos e economia',
      price: 690.00,
      originalPrice: 1078.80,
      discount: 36,
      duration: 'ano',
      planType: 'annual_vip',
      mercadoPagoUrl: this.config.plans.annual_vip,
      features: [
        'Tudo do Plano Anual',
        'Relatórios avançados',
        'Integração com WhatsApp',
        'Templates personalizados',
        'Backup automático na nuvem',
        'Suporte VIP 24/7',
        'Consultoria mensal inclusa',
        'Customizações exclusivas'
      ]
    }
  ];

  /**
   * Retorna todos os planos disponíveis
   */
  getPlans(): MercadoPagoPlan[] {
    return this.plans;
  }

  /**
   * Retorna um plano específico pelo ID
   */
  getPlanById(id: string): MercadoPagoPlan | null {
    return this.plans.find(plan => plan.id === id) || null;
  }

  /**
   * Retorna a URL do Mercado Pago para um plano específico
   */
  getPaymentUrl(planType: string): string {
    const plan = this.plans.find(p => p.planType === planType);
    return plan?.mercadoPagoUrl || '';
  }

  /**
   * Retorna o número do WhatsApp para envio de comprovantes
   */
  getWhatsAppNumber(): string {
    return this.config.whatsappNumber;
  }

  /**
   * Formata o preço para exibição
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }

  /**
   * Gera a mensagem do WhatsApp para envio de comprovante
   */
  generateWhatsAppMessage(plan: MercadoPagoPlan): string {
    const formattedPrice = this.formatPrice(plan.price);
    return `Olá! Acabei de realizar o pagamento do ${plan.name} (${formattedPrice}). Segue o comprovante em anexo.`;
  }

  /**
   * Gera a URL completa do WhatsApp com a mensagem
   */
  generateWhatsAppUrl(plan: MercadoPagoPlan): string {
    const message = this.generateWhatsAppMessage(plan);
    return `https://wa.me/${this.config.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Redireciona para o pagamento do Mercado Pago
   */
  redirectToPayment(plan: MercadoPagoPlan): void {
    if (plan.mercadoPagoUrl) {
      window.open(plan.mercadoPagoUrl, '_blank');
    } else {
      console.error('URL do Mercado Pago não encontrada para o plano:', plan.id);
    }
  }

  /**
   * Abre o WhatsApp para envio de comprovante
   */
  openWhatsAppForProof(plan: MercadoPagoPlan): void {
    const whatsappUrl = this.generateWhatsAppUrl(plan);
    window.open(whatsappUrl, '_blank');
  }
}

// Instância singleton do serviço
export const mercadoPagoService = new MercadoPagoService();
export default mercadoPagoService;