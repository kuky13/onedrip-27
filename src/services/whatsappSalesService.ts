import {
  WhatsAppPlan,
  WhatsAppSale,
  WhatsAppConversion,
  WhatsAppAnalytics,
  CreateWhatsAppSaleRequest,
  CreateWhatsAppSaleResponse,
  TrackConversionRequest,
  TrackConversionResponse,
  GetAnalyticsRequest,
  GetAnalyticsResponse,
  CustomerData,
  WhatsAppSalesConfig,
  MessageVariables
} from '../../shared/types/whatsappSales';
import { formatPhoneNumber, createWhatsAppUrl } from '../utils/whatsapp';
import { generateWhatsAppMessage } from '../utils/whatsappUtils';

class WhatsAppSalesService {
  private config: WhatsAppSalesConfig = {
    businessPhone: '+5511999999999',
    businessName: 'OneDrip',
    welcomeMessage: 'Olá! Obrigado pelo interesse em nossos planos. Como posso ajudá-lo?',
    autoResponseEnabled: true,
    trackingEnabled: true,
    analyticsRetentionDays: 90,
    defaultMessageTemplate: 'plan_info'
  };

  private plans: WhatsAppPlan[] = [
    {
      id: 'basic',
      name: 'Plano Básico',
      description: 'Ideal para pequenos negócios que estão começando',
      price: 97,
      originalPrice: 197,
      features: [
        'Até 1.000 leads por mês',
        'Automação básica',
        'Suporte por email',
        'Dashboard básico',
        'Integração WhatsApp'
      ],
      duration: 'mensal',
      category: 'basic',
      discount: 50
    },
    {
      id: 'premium',
      name: 'Plano Premium',
      description: 'Para empresas que querem crescer rapidamente',
      price: 197,
      originalPrice: 397,
      features: [
        'Até 5.000 leads por mês',
        'Automação avançada',
        'Suporte prioritário',
        'Dashboard completo',
        'Integração WhatsApp + Email',
        'Relatórios detalhados',
        'API personalizada'
      ],
      duration: 'mensal',
      category: 'premium',
      isPopular: true,
      discount: 50
    },
    {
      id: 'enterprise',
      name: 'Plano Enterprise',
      description: 'Solução completa para grandes empresas',
      price: 497,
      originalPrice: 997,
      features: [
        'Leads ilimitados',
        'Automação personalizada',
        'Suporte 24/7',
        'Dashboard executivo',
        'Todas as integrações',
        'Relatórios em tempo real',
        'API completa',
        'Consultoria especializada',
        'Treinamento da equipe'
      ],
      duration: 'mensal',
      category: 'enterprise',
      discount: 50
    }
  ];

  // Get all available plans
  getPlans(): WhatsAppPlan[] {
    return this.plans;
  }

  // Get a specific plan by ID
  getPlanById(planId: string): WhatsAppPlan | null {
    return this.plans.find(plan => plan.id === planId) || null;
  }

  // Create a new WhatsApp sale
  async createSale(request: CreateWhatsAppSaleRequest): Promise<CreateWhatsAppSaleResponse> {
    try {
      const plan = this.getPlanById(request.planId);
      if (!plan) {
        return {
          success: false,
          error: 'Plano não encontrado'
        };
      }

      // Format phone number
      const formattedPhone = formatPhoneNumber(request.customerPhone);
      if (!formattedPhone) {
        return {
          success: false,
          error: 'Número de telefone inválido'
        };
      }

      // Generate WhatsApp message
      const messageVariables: MessageVariables = {
        customerName: request.customerName || 'Cliente',
        planName: plan.name,
        planPrice: plan.price,
        planFeatures: plan.features,
        businessName: this.config.businessName,
        discount: plan.discount
      };

      const whatsappMessage = this.generatePlanMessage(plan, messageVariables);
      const whatsappUrl = createWhatsAppUrl(this.config.businessPhone, whatsappMessage);

      // Create sale record
      const sale: WhatsAppSale = {
        id: this.generateId(),
        planId: request.planId,
        planName: plan.name,
        customerName: request.customerName,
        customerPhone: formattedPhone,
        customerEmail: request.customerEmail,
        price: plan.price,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        whatsappMessageSent: true,
        conversionSource: request.source || 'website',
        notes: request.notes
      };

      // Track conversion
      await this.trackConversion({
        planId: request.planId,
        customerPhone: formattedPhone,
        source: request.source || 'website'
      });

      // Store sale (in a real app, this would be saved to database)
      this.storeSale(sale);

      return {
        success: true,
        sale,
        whatsappUrl,
        message: 'Venda criada com sucesso! Redirecionando para WhatsApp...'
      };
    } catch (error) {
      console.error('Error creating WhatsApp sale:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // Track conversion
  async trackConversion(request: TrackConversionRequest): Promise<TrackConversionResponse> {
    try {
      const plan = this.getPlanById(request.planId);
      if (!plan) {
        return {
          success: false,
          whatsappUrl: '',
          error: 'Plano não encontrado'
        };
      }

      const formattedPhone = formatPhoneNumber(request.customerPhone);
      if (!formattedPhone) {
        return {
          success: false,
          whatsappUrl: '',
          error: 'Número de telefone inválido'
        };
      }

      // Create conversion record
      const conversion: WhatsAppConversion = {
        id: this.generateId(),
        planId: request.planId,
        planName: plan.name,
        customerPhone: formattedPhone,
        clickedAt: new Date(),
        source: request.source || 'website',
        userAgent: request.userAgent,
        referrer: request.referrer,
        status: 'clicked'
      };

      // Store conversion (in a real app, this would be saved to database)
      this.storeConversion(conversion);

      // Generate WhatsApp URL
      const messageVariables: MessageVariables = {
        planName: plan.name,
        planPrice: plan.price,
        planFeatures: plan.features,
        businessName: this.config.businessName,
        discount: plan.discount
      };

      const whatsappMessage = this.generatePlanMessage(plan, messageVariables);
      const whatsappUrl = createWhatsAppUrl(this.config.businessPhone, whatsappMessage);

      return {
        success: true,
        conversionId: conversion.id,
        whatsappUrl,
        message: 'Conversão rastreada com sucesso'
      };
    } catch (error) {
      console.error('Error tracking conversion:', error);
      return {
        success: false,
        whatsappUrl: '',
        error: 'Erro interno do servidor'
      };
    }
  }

  // Get analytics data
  async getAnalytics(request?: GetAnalyticsRequest): Promise<GetAnalyticsResponse> {
    try {
      // In a real app, this would query the database
      const analytics: WhatsAppAnalytics = {
        totalClicks: 150,
        totalConversions: 45,
        conversionRate: 30,
        totalRevenue: 8865,
        averageOrderValue: 197,
        topPerformingPlan: 'premium',
        clicksByPlan: {
          basic: 50,
          premium: 75,
          enterprise: 25
        },
        conversionsByPlan: {
          basic: 15,
          premium: 22,
          enterprise: 8
        },
        revenueByPlan: {
          basic: 1455,
          premium: 4334,
          enterprise: 3976
        },
        dailyStats: [
          {
            date: '2024-01-15',
            clicks: 25,
            conversions: 8,
            revenue: 1576,
            conversionRate: 32
          },
          {
            date: '2024-01-14',
            clicks: 30,
            conversions: 9,
            revenue: 1773,
            conversionRate: 30
          }
        ]
      };

      return {
        success: true,
        analytics
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        success: false,
        error: 'Erro ao buscar analytics'
      };
    }
  }

  // Generate personalized WhatsApp message for a plan
  private generatePlanMessage(plan: WhatsAppPlan, variables: MessageVariables): string {
    const discountText = plan.discount ? `🎉 *OFERTA ESPECIAL: ${plan.discount}% OFF!*\n\n` : '';
    const originalPriceText = plan.originalPrice ? `~R$ ${plan.originalPrice}~` : '';
    
    return `${discountText}Olá! 👋\n\nObrigado pelo interesse no *${plan.name}*!\n\n📋 *Detalhes do Plano:*\n${plan.features.map(feature => `✅ ${feature}`).join('\n')}\n\n💰 *Investimento:*\n${originalPriceText} *R$ ${plan.price}/${plan.duration}*\n\n${plan.description}\n\n🚀 Pronto para começar? Vou te ajudar com todos os detalhes!\n\nQual é a melhor forma de te atender?`;
  }

  // Update sale status
  async updateSaleStatus(saleId: string, status: WhatsAppSale['status']): Promise<boolean> {
    try {
      // In a real app, this would update the database
      console.log(`Updating sale ${saleId} to status: ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating sale status:', error);
      return false;
    }
  }

  // Get sales by status
  async getSalesByStatus(status: WhatsAppSale['status']): Promise<WhatsAppSale[]> {
    try {
      // In a real app, this would query the database
      return [];
    } catch (error) {
      console.error('Error getting sales by status:', error);
      return [];
    }
  }

  // Get configuration
  getConfig(): WhatsAppSalesConfig {
    return this.config;
  }

  // Update configuration
  updateConfig(newConfig: Partial<WhatsAppSalesConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Private helper methods
  private generateId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private storeSale(sale: WhatsAppSale): void {
    // In a real app, this would save to database
    console.log('Storing sale:', sale);
  }

  private storeConversion(conversion: WhatsAppConversion): void {
    // In a real app, this would save to database
    console.log('Storing conversion:', conversion);
  }

  // Static method to create instance
  static getInstance(): WhatsAppSalesService {
    if (!WhatsAppSalesService.instance) {
      WhatsAppSalesService.instance = new WhatsAppSalesService();
    }
    return WhatsAppSalesService.instance;
  }

  private static instance: WhatsAppSalesService;
}

// Export singleton instance
export const whatsappSalesService = WhatsAppSalesService.getInstance();
export default whatsappSalesService;