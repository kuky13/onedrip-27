// ============================================
// SERVIÇO MERCADO PAGO - INTEGRAÇÃO PIX
// ============================================
// Serviço para integração com API do Mercado Pago

import axios from 'axios';
import { toast } from 'sonner';
import type {
  CreatePixTransactionRequest,
  CreatePixTransactionResponse,
  PixTransaction,
  PixCode,
  PlanData,
  MercadoPagoPayment,
  MercadoPagoConfig
} from '../../shared/types/pix';
import { encryptSensitiveData, decryptSensitiveData } from './securityService';
import { logAuditEvent } from './auditService';

// Configuração do Mercado Pago (será obtida das variáveis de ambiente)
const getMercadoPagoConfig = (): MercadoPagoConfig | null => {
  console.log('🔧 Carregando configuração do Mercado Pago...');
  
  const accessToken = import.meta.env.VITE_MERCADO_PAGO_ACCESS_TOKEN;
  const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
  
  console.log('🔑 Access Token presente:', !!accessToken);
  console.log('🔑 Public Key presente:', !!publicKey);
  
  if (!accessToken || !publicKey) {
    console.warn('⚠️ Credenciais do Mercado Pago não configuradas. Sistema PIX não estará disponível.');
    console.warn('💡 Para configurar, adicione no arquivo .env:');
    console.warn('VITE_MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_aqui');
    console.warn('VITE_MERCADO_PAGO_PUBLIC_KEY=seu_public_key_aqui');
    return null;
  }
  
  console.log('✅ Configuração do Mercado Pago carregada com sucesso');
  
  return {
    accessToken,
    publicKey,
    webhookUrl: 'https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-webhook',
    notificationUrl: 'https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-webhook'
  };
};

// URL base da API do Mercado Pago
const MP_API_BASE = 'https://api.mercadopago.com';

// Classe principal do serviço Mercado Pago
export class MercadoPagoService {
  private config: MercadoPagoConfig | null;
  private axiosInstance;
  private isConfigured: boolean;

  constructor() {
    this.config = getMercadoPagoConfig();
    this.isConfigured = this.config !== null;
    
    if (this.isConfigured && this.config) {
      this.axiosInstance = axios.create({
        baseURL: MP_API_BASE,
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': this.generateIdempotencyKey()
        },
        timeout: 30000 // 30 segundos
      });
    } else {
      // Criar instância sem configuração para evitar erro
      this.axiosInstance = axios.create({
        baseURL: MP_API_BASE,
        timeout: 30000
      });
    }
  }

  // Verificar se o serviço está configurado
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  // Gerar chave de idempotência
  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Calcular preço total do plano
  private calculateTotalPrice(planData: PlanData): number {
    const basePrice = planData.price;
    const vipPrice = planData.isVip ? (planData.vipPrice || 10.00) : 0;
    return basePrice + vipPrice;
  }

  // Gerar descrição da transação
  private generateDescription(planData: PlanData): string {
    const vipText = planData.isVip ? ' + VIP' : '';
    const periodText = planData.type === 'yearly' ? 'Anual' : 'Mensal';
    return `OneDrip - Plano ${periodText}${vipText}`;
  }

  // Criar pagamento PIX
  async createPixPayment(request: CreatePixTransactionRequest): Promise<CreatePixTransactionResponse> {
    try {
      console.log('🚀 Iniciando criação de pagamento PIX:', request);
      
      // Verificar se o serviço está configurado
      if (!this.isServiceConfigured()) {
        throw new Error('Sistema PIX não está configurado. Configure as credenciais do Mercado Pago no arquivo .env para usar esta funcionalidade.');
      }
      
      // Validar dados de entrada
      if (!request.userEmail) {
        throw new Error('Email do usuário é obrigatório');
      }
      if (!request.planType) {
        throw new Error('Tipo de plano é obrigatório');
      }
      
      console.log('✅ Dados de entrada validados');
      
      // Verificar configuração do Mercado Pago
      console.log('🔧 Verificando configuração do Mercado Pago...');
      if (!this.config?.accessToken) {
        throw new Error('Access Token do Mercado Pago não configurado');
      }
      if (!this.config?.publicKey) {
        throw new Error('Public Key do Mercado Pago não configurado');
      }
      console.log('✅ Configuração do Mercado Pago OK', { 
        hasAccessToken: !!this.config.accessToken,
        hasPublicKey: !!this.config.publicKey
      });
      
      // Log da tentativa de criação
      await logAuditEvent({
        action: 'create_pix_payment_attempt',
        details: {
          planType: request.planType,
          isVip: request.isVip,
          userEmail: request.userEmail
        },
        userEmail: request.userEmail
      });

      // Dados do plano baseado no tipo selecionado
      console.log('📋 Obtendo dados do plano...');
      const planData: PlanData = this.getPlanData(request.planType, request.isVip);
      console.log('📋 Dados do plano:', planData);
      
      const totalAmount = this.calculateTotalPrice(planData);
      console.log('💰 Valor total calculado:', totalAmount);
      
      const description = this.generateDescription(planData);
      console.log('📝 Descrição gerada:', description);

      // Dados da preferência de pagamento
      console.log('📦 Criando preferência de pagamento...');
      
      const expirationHours = parseInt(import.meta.env.VITE_PIX_EXPIRATION_HOURS || '24');
      const expirationDate = new Date(Date.now() + (expirationHours * 60 * 60 * 1000));
      
      console.log('⏰ Configuração de expiração:', {
        hours: expirationHours,
        expirationDate: expirationDate.toISOString()
      });
      
      const preferenceData = {
        items: [{
          id: `plan-${planData.type}-${planData.isVip ? 'vip' : 'normal'}`,
          title: description,
          description: description,
          quantity: 1,
          unit_price: totalAmount,
          currency_id: 'BRL'
        }],
        payer: {
          email: request.userEmail
        },
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 1,
          default_payment_method_id: 'pix'
        },
        back_urls: {
          success: `${window.location.origin}/plans/payment/success`,
          failure: `${window.location.origin}/plans/payment/failure`,
          pending: `${window.location.origin}/plans/payment/pending`
        },
        auto_return: 'approved',
        external_reference: this.generateExternalReference(request),
        notification_url: this.config.notificationUrl,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: expirationDate.toISOString(),
        metadata: {
          user_email: request.userEmail,
          user_id: request.userId,
          plan_type: request.planType,
          is_vip: request.isVip,
          created_at: new Date().toISOString()
        }
      };
      
      console.log('📦 Preferência criada:', {
        ...preferenceData,
        items: preferenceData.items.map(item => ({
          ...item,
          unit_price: `R$ ${item.unit_price}`
        }))
      });

      // Criar preferência no Mercado Pago
      console.log('🌐 Enviando requisição para Mercado Pago...');
      console.log('🔗 URL da requisição:', this.axiosInstance.defaults.baseURL + '/checkout/preferences');
      console.log('🔑 Headers da requisição:', {
        'Authorization': this.axiosInstance.defaults.headers.Authorization ? 'Bearer [PRESENTE]' : 'AUSENTE',
        'Content-Type': this.axiosInstance.defaults.headers['Content-Type']
      });
      
      const response = await this.axiosInstance.post('/checkout/preferences', preferenceData);
      
      console.log('✅ Resposta do Mercado Pago recebida');
      console.log('📊 Status da resposta:', response.status);
      console.log('📄 Dados da resposta:', response.data);
      
      if (!response.data || !response.data.id) {
        console.error('❌ Resposta inválida do Mercado Pago:', response.data);
        throw new Error('Resposta inválida do Mercado Pago');
      }
      
      console.log('✅ Preferência criada com sucesso. ID:', response.data.id);

      // Gerar código PIX e QR Code
      console.log('🔢 Gerando código PIX...');
      const pixCode = await this.generatePixCode(response.data.id, totalAmount, description);
      console.log('✅ Código PIX gerado:', pixCode);

      // Criar objeto de transação
      const transaction: PixTransaction = {
        id: this.generateTransactionId(),
        userId: request.userId || '',
        userEmail: request.userEmail,
        planData,
        pixCode,
        status: 'pending',
        mercadoPagoId: response.data.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        notificationSent: false,
        whatsappNumber: '64996028022' // Número do suporte
      };

      // Salvar transação no banco de dados
      await this.saveTransaction(transaction);

      // Log de sucesso
      await logAuditEvent({
        action: 'pix_payment_created',
        details: {
          transactionId: transaction.id,
          mercadoPagoId: response.data.id,
          amount: totalAmount,
          planType: request.planType,
          isVip: request.isVip
        },
        userId: request.userId,
        userEmail: request.userEmail
      });

      return {
        transaction,
        redirectUrl: `/plans/payment/pix/${transaction.id}`
      };

    } catch (error) {
      console.error('❌ Erro ao criar pagamento PIX:', error);
      
      let errorMessage = 'Erro desconhecido ao processar pagamento';
      let errorDetails: any = {};
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('📋 Mensagem do erro:', errorMessage);
        
        // Verificar se é erro de configuração
        if (errorMessage.includes('Access Token') || errorMessage.includes('Public Key')) {
          errorMessage = 'Erro de configuração do Mercado Pago. Verifique as credenciais.';
        }
      }
      
      // Se for erro do axios, extrair mais detalhes
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('🌐 Erro HTTP:', axiosError.response?.status);
        console.error('📄 Dados da resposta:', axiosError.response?.data);
        console.error('🔗 URL da requisição:', axiosError.config?.url);
        
        errorDetails = {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          url: axiosError.config?.url
        };
        
        // Mapear códigos de erro HTTP para mensagens mais amigáveis
        switch (axiosError.response?.status) {
          case 400:
            errorMessage = 'Dados inválidos enviados para o Mercado Pago';
            break;
          case 401:
            errorMessage = 'Credenciais do Mercado Pago inválidas ou expiradas';
            break;
          case 403:
            errorMessage = 'Acesso negado pelo Mercado Pago. Verifique as permissões da conta';
            break;
          case 404:
            errorMessage = 'Serviço do Mercado Pago não encontrado';
            break;
          case 429:
            errorMessage = 'Muitas requisições. Tente novamente em alguns minutos';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Erro interno do Mercado Pago. Tente novamente';
            break;
          default:
            if (axiosError.response?.data?.message) {
              errorMessage = axiosError.response.data.message;
            } else if (axiosError.response?.data?.error) {
              errorMessage = axiosError.response.data.error;
            } else {
              errorMessage = `Erro de comunicação com o Mercado Pago (${axiosError.response?.status})`;
            }
        }
      }
      
      // Se for erro de rede
      if (error && typeof error === 'object' && 'code' in error) {
        const networkError = error as any;
        if (networkError.code === 'ECONNABORTED') {
          errorMessage = 'Timeout na comunicação com o Mercado Pago. Tente novamente';
        } else if (networkError.code === 'ENOTFOUND' || networkError.code === 'ECONNREFUSED') {
          errorMessage = 'Erro de conexão com o Mercado Pago. Verifique sua internet';
        }
      }
      
      // Log do erro
      try {
        await logAuditEvent({
          action: 'pix_payment_error',
          details: {
            error: errorMessage,
            errorDetails,
            planType: request.planType,
            isVip: request.isVip
          },
          userEmail: request.userEmail
        });
      } catch (logError) {
        console.error('Erro ao registrar log de auditoria:', logError);
      }

      console.error('🚨 Erro final a ser exibido:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  // Gerar código PIX e QR Code
  private async generatePixCode(preferenceId: string, amount: number, description: string): Promise<PixCode> {
    try {
      console.log('🔍 [PIX] Iniciando geração do código PIX');
      console.log('🔍 [PIX] Preference ID:', preferenceId);
      console.log('🔍 [PIX] Amount:', amount);
      console.log('🔍 [PIX] Description:', description);
      console.log('🔍 [PIX] Access Token presente:', !!this.config?.accessToken);
      console.log('🔍 [PIX] Base URL:', this.axiosInstance.defaults.baseURL);
      
      // Buscar dados da preferência para obter o código PIX
      console.log('🔍 [PIX] Buscando dados da preferência:', preferenceId);
      const preferenceResponse = await this.axiosInstance.get(`/checkout/preferences/${preferenceId}`);
      console.log('📋 [PIX] Dados da preferência obtidos:', JSON.stringify(preferenceResponse.data, null, 2));
      
      // Verificar se a preferência foi encontrada
      if (!preferenceResponse.data || !preferenceResponse.data.id) {
        console.error('❌ [PIX] Preferência não encontrada ou inválida');
        throw new Error('Preferência de pagamento não encontrada');
      }
      
      // Gerar código PIX usando a API do Mercado Pago
      const pixData = {
        transaction_amount: amount,
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: preferenceResponse.data.payer?.email || 'user@example.com'
        }
      };
      
      console.log('💳 [PIX] Dados do PIX para envio:', JSON.stringify(pixData, null, 2));
      console.log('💳 [PIX] Headers da requisição:', this.axiosInstance.defaults.headers);
      
      const pixResponse = await this.axiosInstance.post('/v1/payments', pixData);
      console.log('📥 [PIX] Status da resposta:', pixResponse.status);
      console.log('📥 [PIX] Resposta completa da criação do PIX:', JSON.stringify(pixResponse.data, null, 2));
      
      // Verificar se a resposta contém os dados necessários
      if (!pixResponse.data) {
        console.error('❌ [PIX] Resposta vazia da API do Mercado Pago');
        throw new Error('Resposta vazia da API do Mercado Pago');
      }
      
      if (!pixResponse.data.point_of_interaction) {
        console.error('❌ [PIX] point_of_interaction não encontrado na resposta');
        console.error('❌ [PIX] Estrutura da resposta:', Object.keys(pixResponse.data));
        throw new Error('Dados de interação PIX não encontrados na resposta da API');
      }
      
      if (!pixResponse.data.point_of_interaction.transaction_data) {
        console.error('❌ [PIX] transaction_data não encontrado');
        console.error('❌ [PIX] Estrutura do point_of_interaction:', Object.keys(pixResponse.data.point_of_interaction));
        throw new Error('Dados da transação PIX não encontrados');
      }

      const pixInfo = pixResponse.data.point_of_interaction.transaction_data;
      console.log('🎯 [PIX] Dados da transação PIX:', JSON.stringify(pixInfo, null, 2));
      
      // Verificar se o código PIX foi gerado
      if (!pixInfo.qr_code && !pixInfo.qr_code_base64) {
        console.error('❌ [PIX] Código PIX não foi gerado');
        console.error('❌ [PIX] Dados disponíveis:', Object.keys(pixInfo));
        throw new Error('Código PIX não foi gerado pela API do Mercado Pago');
      }
      
      const pixCode = {
        id: this.generatePixCodeId(),
        code: pixInfo.qr_code || '',
        qrCodeBase64: pixInfo.qr_code_base64 || '',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        amount: amount,
        description: description
      };
      
      console.log('✅ [PIX] Código PIX gerado com sucesso:', {
        id: pixCode.id,
        hasCode: !!pixCode.code,
        hasQrCodeBase64: !!pixCode.qrCodeBase64,
        amount: pixCode.amount
      });
      
      return pixCode;

    } catch (error) {
      console.error('❌ [PIX] Erro ao gerar código PIX:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('🌐 [PIX] Status HTTP:', axiosError.response?.status);
        console.error('📄 [PIX] Dados do erro:', JSON.stringify(axiosError.response?.data, null, 2));
        console.error('🔗 [PIX] URL da requisição:', axiosError.config?.url);
        console.error('🔗 [PIX] Método da requisição:', axiosError.config?.method);
        console.error('🔗 [PIX] Headers da requisição:', axiosError.config?.headers);
        
        // Tratar erros específicos da API
        if (axiosError.response?.status === 401) {
          throw new Error('Credenciais do Mercado Pago inválidas. Verifique o Access Token.');
        } else if (axiosError.response?.status === 400) {
          const errorData = axiosError.response?.data;
          if (errorData?.message) {
            throw new Error(`Erro na requisição: ${errorData.message}`);
          } else {
            throw new Error('Dados inválidos enviados para a API do Mercado Pago');
          }
        } else if (axiosError.response?.status === 404) {
          throw new Error('Endpoint da API do Mercado Pago não encontrado');
        } else if (axiosError.response?.status >= 500) {
          throw new Error('Erro interno da API do Mercado Pago. Tente novamente em alguns minutos.');
        }
      }
      
      // Se for um erro conhecido, re-lançar
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Falha inesperada ao gerar código PIX');
    }
  }

  // Obter dados do plano
  private getPlanData(planType: 'monthly' | 'yearly', isVip: boolean): PlanData {
    const plans = {
      monthly: {
        id: 'plan-monthly',
        name: 'Plano Profissional',
        type: 'monthly' as const,
        price: 68.90,
        originalPrice: 80.00,
        currency: 'R$',
        period: '/mês',
        isVip,
        vipPrice: isVip ? 10.00 : undefined
      },
      yearly: {
        id: 'plan-yearly',
        name: 'Plano Profissional Anual',
        type: 'yearly' as const,
        price: 638.55,
        originalPrice: 800.00,
        currency: 'R$',
        period: '/ano',
        isVip,
        vipPrice: isVip ? 120.00 : undefined // 12 meses x R$ 10
      }
    };

    return plans[planType];
  }

  // Gerar ID único para transação
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Gerar ID único para código PIX
  private generatePixCodeId(): string {
    return `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Gerar referência externa
  private generateExternalReference(request: CreatePixTransactionRequest): string {
    return `onedrip_${request.planType}_${request.isVip ? 'vip' : 'normal'}_${Date.now()}`;
  }

  // Salvar transação no banco de dados (implementar com Supabase)
  private async saveTransaction(transaction: PixTransaction): Promise<void> {
    try {
      // Criptografar dados sensíveis
      const encryptedData = await encryptSensitiveData({
        userEmail: transaction.userEmail,
        pixCode: transaction.pixCode.code
      });

      // Aqui será implementada a integração com Supabase
      // Por enquanto, salvar no localStorage para desenvolvimento
      const transactions = JSON.parse(localStorage.getItem('pix_transactions') || '[]');
      transactions.push({
        ...transaction,
        encryptedData
      });
      localStorage.setItem('pix_transactions', JSON.stringify(transactions));
      
      console.log('Transação salva:', transaction.id);
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      throw error;
    }
  }

  // Verificar status do pagamento
  async checkPaymentStatus(mercadoPagoPaymentId: string): Promise<MercadoPagoPayment> {
    try {
      const response = await this.axiosInstance.get(`/v1/payments/${mercadoPagoPaymentId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      throw error;
    }
  }

  // Processar webhook do Mercado Pago
  async processWebhook(webhookData: any): Promise<void> {
    try {
      if (webhookData.type === 'payment') {
        const paymentId = webhookData.data.id;
        const payment = await this.checkPaymentStatus(paymentId);
        
        // Atualizar status da transação baseado no pagamento
        await this.updateTransactionStatus(payment);
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  // Atualizar status da transação
  private async updateTransactionStatus(payment: MercadoPagoPayment): Promise<void> {
    try {
      // Buscar transação pelo external_reference ou payment_id
      // Implementar busca no banco de dados
      
      // Log da atualização
      await logAuditEvent({
        action: 'transaction_status_updated',
        details: {
          paymentId: payment.id,
          status: payment.status,
          amount: payment.transaction_amount
        }
      });
      
    } catch (error) {
      console.error('Erro ao atualizar status da transação:', error);
      throw error;
    }
  }
}

// Instância singleton do serviço
export const mercadoPagoService = new MercadoPagoService();

// Funções de conveniência para uso direto
export const createPixPayment = (request: CreatePixTransactionRequest) => 
  mercadoPagoService.createPixPayment(request);

export const checkPaymentStatus = (paymentId: string) => 
  mercadoPagoService.checkPaymentStatus(paymentId);

export const processWebhook = (webhookData: any) => 
  mercadoPagoService.processWebhook(webhookData);

export default mercadoPagoService;