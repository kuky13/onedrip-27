// ============================================
// SERVIÇO PIX OTIMIZADO - VERSÃO MELHORADA
// ============================================
// Serviço otimizado para pagamentos PIX com melhorias de performance e segurança

import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'sonner';
import type {
  CreatePixTransactionRequest,
  CreatePixTransactionResponse,
  PixTransaction,
  PlanData,
  PixCode
} from '../../shared/types/pix';
import { supabase } from '@/integrations/supabase/client';

// Cache para configurações
const configCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Rate limiting simples
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 10;

// Circuit breaker
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailureTime: 0,
  state: 'CLOSED'
};

// Configuração otimizada do Mercado Pago
class OptimizedMercadoPagoConfig {
  private static instance: OptimizedMercadoPagoConfig;
  private config: any = null;
  private lastCheck: number = 0;

  static getInstance(): OptimizedMercadoPagoConfig {
    if (!OptimizedMercadoPagoConfig.instance) {
      OptimizedMercadoPagoConfig.instance = new OptimizedMercadoPagoConfig();
    }
    return OptimizedMercadoPagoConfig.instance;
  }

  async getConfig(): Promise<any> {
    const now = Date.now();
    
    // Cache hit - retornar configuração em cache
    if (this.config && (now - this.lastCheck) < CACHE_TTL) {
      return this.config;
    }

    console.log('🔧 Carregando configuração otimizada do Mercado Pago...');
    
    const accessToken = import.meta.env.VITE_MERCADO_PAGO_ACCESS_TOKEN;
    const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
    
    if (!accessToken || !publicKey) {
      console.warn('⚠️ Credenciais do Mercado Pago não configuradas');
      this.config = null;
      return null;
    }

    this.config = {
      accessToken,
      publicKey,
      webhookUrl: 'https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-webhook',
      notificationUrl: 'https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-webhook'
    };

    this.lastCheck = now;
    console.log('✅ Configuração do Mercado Pago carregada e cacheada');
    
    return this.config;
  }

  isConfigured(): boolean {
    return this.config !== null;
  }
}

// Classe principal otimizada
export class OptimizedPixPaymentService {
  private axiosInstance: AxiosInstance;
  private configManager: OptimizedMercadoPagoConfig;

  constructor() {
    this.configManager = OptimizedMercadoPagoConfig.getInstance();
    
    // Configuração otimizada do axios
    this.axiosInstance = axios.create({
      baseURL: 'https://api.mercadopago.com',
      timeout: 15000, // Reduzido para 15s
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OneDrip-PIX-Service/2.0'
      },
      // Configurações de performance
      maxContentLength: 50 * 1024 * 1024, // 50MB
      maxBodyLength: 50 * 1024 * 1024,
      validateStatus: (status) => status < 500, // Retry apenas em 5xx
    });

    // Interceptors otimizados
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - adicionar auth header
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const mpConfig = await this.configManager.getConfig();
        if (mpConfig?.accessToken) {
          config.headers.Authorization = `Bearer ${mpConfig.accessToken}`;
        }
        
        // Adicionar idempotency key
        if (config.method === 'post') {
          config.headers['X-Idempotency-Key'] = this.generateIdempotencyKey();
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - tratamento de erro otimizado
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Reset circuit breaker em sucesso
        this.resetCircuitBreaker();
        return response;
      },
      async (error: AxiosError) => {
        await this.handleRequestError(error);
        return Promise.reject(error);
      }
    );
  }

  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async handleRequestError(error: AxiosError): Promise<void> {
    // Atualizar circuit breaker
    this.updateCircuitBreaker();
    
    // Log detalhado do erro
    await this.logError('mp_api_error', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
  }

  private updateCircuitBreaker(): void {
    circuitBreaker.failures++;
    circuitBreaker.lastFailureTime = Date.now();
    
    if (circuitBreaker.failures >= 3) {
      circuitBreaker.state = 'OPEN';
      console.warn('🔴 Circuit breaker OPEN - bloqueando requisições temporariamente');
    }
  }

  private resetCircuitBreaker(): void {
    circuitBreaker.failures = 0;
    circuitBreaker.state = 'CLOSED';
  }

  private checkCircuitBreaker(): boolean {
    if (circuitBreaker.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
      
      // Tentar half-open após 30 segundos
      if (timeSinceLastFailure > 30000) {
        circuitBreaker.state = 'HALF_OPEN';
        console.log('🟡 Circuit breaker HALF_OPEN - tentando requisição de teste');
        return true;
      }
      
      return false; // Bloquear requisição
    }
    
    return true; // Permitir requisição
  }

  private checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const windowKey = `${identifier}-${Math.floor(now / RATE_LIMIT_WINDOW)}`;
    
    const currentCount = rateLimitMap.get(windowKey) || 0;
    
    if (currentCount >= MAX_REQUESTS_PER_WINDOW) {
      console.warn(`🚫 Rate limit excedido para ${identifier}`);
      return false;
    }
    
    rateLimitMap.set(windowKey, currentCount + 1);
    
    // Limpeza periódica do map
    if (Math.random() < 0.1) {
      this.cleanupRateLimitMap();
    }
    
    return true;
  }

  private cleanupRateLimitMap(): void {
    const now = Date.now();
    const cutoff = Math.floor((now - RATE_LIMIT_WINDOW * 2) / RATE_LIMIT_WINDOW);
    
    for (const [key] of rateLimitMap) {
      const windowTime = parseInt(key.split('-').pop() || '0');
      if (windowTime < cutoff) {
        rateLimitMap.delete(key);
      }
    }
  }

  async createPixPayment(request: CreatePixTransactionRequest): Promise<CreatePixTransactionResponse> {
    const startTime = Date.now();
    
    try {
      // Validações preliminares
      await this.validateRequest(request);
      
      // Verificar circuit breaker
      if (!this.checkCircuitBreaker()) {
        throw new Error('Serviço temporariamente indisponível. Tente novamente em alguns minutos.');
      }
      
      // Rate limiting
      if (!this.checkRateLimit(request.userEmail)) {
        throw new Error('Muitas tentativas. Aguarde um momento e tente novamente.');
      }

      // Verificar configuração
      const config = await this.configManager.getConfig();
      if (!config) {
        throw new Error('Sistema PIX não configurado. Contate o suporte técnico.');
      }

      console.log('🚀 Iniciando criação otimizada de pagamento PIX');
      
      // Log da tentativa
      await this.logEvent('pix_payment_attempt', {
        planType: request.planType,
        isVip: request.isVip,
        userEmail: request.userEmail
      });

      // Gerar dados do plano
      const planData = this.generatePlanData(request.planType, request.isVip);
      const totalAmount = this.calculatePrice(planData);

      // Criar preferência otimizada
      const preferenceData = this.buildOptimizedPreference(
        planData, 
        totalAmount, 
        request.userEmail, 
        request
      );

      console.log('📦 Enviando preferência para Mercado Pago...');
      const response = await this.axiosInstance.post('/checkout/preferences', preferenceData);

      if (!response.data?.id) {
        throw new Error('Resposta inválida do Mercado Pago');
      }

      console.log('✅ Preferência criada - ID:', response.data.id);

      // Gerar código PIX
      const pixCode = await this.generateOptimizedPixCode(
        response.data.id, 
        totalAmount, 
        planData.name
      );

      // Criar transação
      const transaction = this.buildTransaction(request, planData, pixCode, response.data.id);
      
      // Salvar no banco de forma assíncrona (não bloquear resposta)
      this.saveTransactionAsync(transaction);

      // Log de sucesso
      await this.logEvent('pix_payment_created_success', {
        transactionId: transaction.id,
        amount: totalAmount,
        responseTime: Date.now() - startTime
      });

      return {
        transaction,
        redirectUrl: `/plans/payment/pix/${transaction.id}`
      };

    } catch (error) {
      console.error('❌ Erro na criação otimizada de PIX:', error);
      
      // Log detalhado do erro
      await this.logError('pix_payment_error', {
        error: error instanceof Error ? error.message : String(error),
        planType: request.planType,
        responseTime: Date.now() - startTime
      });

      throw this.enhanceError(error);
    }
  }

  private async validateRequest(request: CreatePixTransactionRequest): Promise<void> {
    const errors: string[] = [];

    if (!request.userEmail) {
      errors.push('Email é obrigatório');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.userEmail)) {
      errors.push('Email inválido');
    }

    if (!request.planType || !['monthly', 'yearly'].includes(request.planType)) {
      errors.push('Tipo de plano inválido');
    }

    if (typeof request.isVip !== 'boolean') {
      errors.push('Opção VIP deve ser especificada');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  private generatePlanData(planType: string, isVip: boolean): PlanData {
    const basePrice = planType === 'monthly' ? 29.90 : 299.90;
    const vipPrice = isVip ? (planType === 'monthly' ? 20.00 : 200.00) : 0;

    return {
      id: `plan-${planType}-${isVip ? 'vip' : 'normal'}`,
      name: `OneDrip ${planType === 'monthly' ? 'Mensal' : 'Anual'}${isVip ? ' VIP' : ''}`,
      type: planType as any,
      price: basePrice,
      vipPrice: vipPrice,
      currency: 'BRL',
      period: planType === 'monthly' ? 'mensal' : 'anual',
      isVip
    };
  }

  private calculatePrice(planData: PlanData): number {
    return planData.price + (planData.vipPrice || 0);
  }

  private buildOptimizedPreference(
    planData: PlanData, 
    amount: number, 
    userEmail: string, 
    request: CreatePixTransactionRequest
  ) {
    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const externalReference = `onedrip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      items: [{
        id: planData.id,
        title: planData.name,
        description: `Assinatura ${planData.name}`,
        quantity: 1,
        unit_price: amount,
        currency_id: 'BRL'
      }],
      payer: {
        email: userEmail
      },
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' },
          { id: 'ticket' }
        ],
        installments: 1,
        default_payment_method_id: 'pix'
      },
      back_urls: {
        success: `${window.location.origin}/payment/success`,
        failure: `${window.location.origin}/payment/failure`,
        pending: `${window.location.origin}/payment/pending`
      },
      auto_return: 'approved',
      external_reference: externalReference,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: expirationDate.toISOString(),
      metadata: {
        user_email: userEmail,
        user_id: request.userId,
        plan_type: request.planType,
        is_vip: request.isVip,
        service: 'onedrip',
        version: '2.0'
      }
    };
  }

  private async generateOptimizedPixCode(
    preferenceId: string, 
    amount: number, 
    description: string
  ): Promise<PixCode> {
    try {
      console.log('🔢 Gerando código PIX otimizado...');

      // Buscar dados da preferência
      const preferenceResponse = await this.axiosInstance.get(`/checkout/preferences/${preferenceId}`);
      
      if (!preferenceResponse.data?.id) {
        throw new Error('Preferência não encontrada');
      }

      // Criar pagamento PIX
      const pixData = {
        transaction_amount: amount,
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: preferenceResponse.data.payer?.email || 'user@example.com'
        }
      };

      const pixResponse = await this.axiosInstance.post('/v1/payments', pixData);
      
      if (!pixResponse.data?.point_of_interaction?.transaction_data) {
        throw new Error('Dados PIX não retornados pela API');
      }

      const pixInfo = pixResponse.data.point_of_interaction.transaction_data;

      return {
        id: `pix_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        code: pixInfo.qr_code || '',
        qrCodeBase64: pixInfo.qr_code_base64 || '',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        amount: amount,
        description: description
      };

    } catch (error) {
      console.error('❌ Erro ao gerar código PIX:', error);
      throw new Error('Falha na geração do código PIX');
    }
  }

  private buildTransaction(
    request: CreatePixTransactionRequest,
    planData: PlanData,
    pixCode: PixCode,
    mercadoPagoId: string
  ): PixTransaction {
    return {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      userId: request.userId || '',
      userEmail: request.userEmail,
      planData,
      pixCode,
      status: 'pending',
      mercadoPagoId,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      notificationSent: false,
      whatsappNumber: '556496028022'
    };
  }

  private async saveTransactionAsync(transaction: PixTransaction): Promise<void> {
    try {
      const { error } = await supabase
        .from('pix_transactions')
        .insert({
          id: transaction.id,
          user_id: transaction.userId || null,
          plan_type: transaction.planData.type,
          is_vip: transaction.planData.isVip,
          amount: transaction.pixCode.amount,
          status: transaction.status,
          mercado_pago_id: transaction.mercadoPagoId,
          pix_code: transaction.pixCode.code,
          qr_code: transaction.pixCode.qrCodeBase64,
          expires_at: transaction.expiresAt.toISOString(),
          metadata: {
            planData: transaction.planData,
            whatsappNumber: transaction.whatsappNumber
          }
        });

      if (error) {
        console.error('Erro ao salvar transação:', error);
        // Não falhar a operação por erro de DB
      } else {
        console.log('✅ Transação salva no banco:', transaction.id);
      }
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
    }
  }

  private async logEvent(action: string, details: any): Promise<void> {
    try {
      await supabase
        .from('transaction_logs')
        .insert({
          event_type: action,
          webhook_data: details,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  }

  private async logError(action: string, details: any): Promise<void> {
    try {
      await supabase
        .from('transaction_logs')
        .insert({
          event_type: action,
          webhook_data: {
            ...details,
            severity: 'error',
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Erro ao registrar log de erro:', error);
    }
  }

  private enhanceError(error: any): Error {
    if (error instanceof Error) {
      // Mapear erros específicos para mensagens amigáveis
      if (error.message.includes('timeout')) {
        return new Error('Tempo limite excedido. Verifique sua conexão e tente novamente.');
      }
      if (error.message.includes('401') || error.message.includes('403')) {
        return new Error('Erro de autenticação com sistema de pagamento. Contate o suporte.');
      }
      if (error.message.includes('500') || error.message.includes('502')) {
        return new Error('Sistema de pagamento temporariamente indisponível. Tente novamente.');
      }
    }
    
    return error instanceof Error ? error : new Error('Erro desconhecido no processamento PIX');
  }
}

// Instância singleton
export const optimizedPixService = new OptimizedPixPaymentService();
export default optimizedPixService;