import axios from 'axios';
import { toast } from 'sonner';

// Supabase Edge Functions URL - substitua YOUR_PROJECT_ID pelo ID do seu projeto
const SUPABASE_PROJECT_ID = 'oghjlypdnmqecaavekyr';
const API_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naGpseXBkbm1xZWNhYXZla3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTI3NTcsImV4cCI6MjA2MTUyODc1N30.aor71Dj3pcEa7N82vGdW5MlciiNnl1ISqAimEyPbbJY';

// Configurar axios com timeout e retry
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'apikey': SUPABASE_ANON_KEY,
    'Origin': window.location.origin
  }
});

// Interceptor para retry automático
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Se não tem configuração de retry, adicionar
    if (!config.__retryCount) {
      config.__retryCount = 0;
    }
    
    // Retry apenas para erros de rede ou timeout (não para erros 4xx)
    const shouldRetry = (
      config.__retryCount < 2 && // máximo 2 tentativas
      (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'TIMEOUT' ||
        (error.response && error.response.status >= 500)
      )
    );
    
    if (shouldRetry) {
      config.__retryCount += 1;
      console.log(`🔄 Tentativa ${config.__retryCount + 1} para ${config.url}`);
      
      // Delay progressivo: 1s, 2s, 3s
      const delay = config.__retryCount * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return apiClient(config);
    }
    
    return Promise.reject(error);
  }
);

// Interface para dados de pagamento PIX
export interface PixPaymentData {
  planType: 'monthly' | 'yearly';
  isVip: boolean;
  userEmail: string;
}

// Interface para resposta da API de criação de preferência
export interface PixPreferenceResponse {
  success: boolean;
  preference_id: string;
  init_point: string;
  sandbox_init_point: string;
  qr_code?: string;
  qr_code_base64?: string;
  transaction_id: string;
  amount: number;
  expires_at: string;
}

// Interface para status de pagamento
export interface PaymentStatus {
  transaction_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  amount: number;
  plan_type: string;
  is_vip: boolean;
  created_at: string;
  expires_at: string;
  updated_at?: string;
}

// Função para validar configuração do backend
export const validateBackendConfig = async (): Promise<boolean> => {
  try {
    console.log('🔍 Validando configuração do backend...');
    
    const response = await apiClient.get('/api/config/validate', {
      timeout: 10000 // timeout menor para validação
    });
    
    if (response.data.success) {
      console.log('✅ Backend configurado corretamente');
      return true;
    } else {
      console.error('❌ Backend não está configurado corretamente:', response.data.message);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Erro ao validar configuração do backend:', error.message);
    return false;
  }
};

// Função para criar preferência PIX
export const createPixPreference = async (paymentData: PixPaymentData): Promise<PixPreferenceResponse> => {
  try {
    console.log('🚀 Criando preferência PIX:', {
      planType: paymentData.planType,
      userEmail: paymentData.userEmail,
      timestamp: new Date().toISOString()
    });
    
    const response = await apiClient.post('/api/pix/create-preference', paymentData);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Erro ao criar preferência PIX');
    }
    
    console.log('✅ Preferência PIX criada:', response.data);
    return response.data;
    
  } catch (error: any) {
    console.error('❌ Erro ao criar pagamento PIX:', error);
    
    const errorMessage = error.response?.data?.message || error.message || 'Erro ao criar pagamento PIX';
    toast.error(errorMessage);
    
    throw new Error(errorMessage);
  }
};

// Função principal para criar preferência PIX
export const createPixPayment = async (data: PixPaymentData): Promise<PixPreferenceResponse> => {
  try {
    console.log('🔄 Criando pagamento PIX:', data);
    
    // Validação dos parâmetros
    if (!data.planType || !data.userEmail) {
      throw new Error('Parâmetros obrigatórios: planType e userEmail');
    }
    
    if (!['monthly', 'yearly'].includes(data.planType)) {
      throw new Error(`Tipo de plano inválido: ${data.planType}`);
    }
    
    const response = await apiClient.post('/pix-payment', data);
    
    if (!response.data.preference_id) {
      throw new Error(response.data.error || 'Erro ao criar preferência PIX');
    }
    
    console.log('✅ Preferência PIX criada:', response.data);
    
    // Adaptar resposta da Edge Function para o formato esperado
    return {
      success: true,
      preference_id: response.data.preference_id,
      qr_code: response.data.qr_code,
      qr_code_base64: response.data.qr_code_base64,
      transaction_id: response.data.external_reference,
      amount: response.data.amount,
      plan_name: response.data.plan_name
    };
    
  } catch (error: any) {
    console.error('❌ Erro ao criar pagamento PIX:', error);
    
    const errorMessage = error.response?.data?.message || error.message || 'Erro ao criar pagamento PIX';
    toast.error(errorMessage);
    
    throw new Error(errorMessage);
  }
};

// Função para verificar status do pagamento
export const checkPaymentStatus = async (transactionId: string): Promise<PaymentStatus> => {
  try {
    console.log('🔍 Verificando status do pagamento:', transactionId);
    
    const response = await axios.get(`${API_URL}/pix-status?external_reference=${transactionId}`);
    
    console.log('📊 Status do pagamento:', response.data);
    return response.data;
    
  } catch (error: any) {
    console.error('❌ Erro ao verificar status:', error);
    
    const errorMessage = error.response?.data?.message || error.message || 'Erro ao verificar status do pagamento';
    throw new Error(errorMessage);
  }
};

// Função para iniciar processo de pagamento PIX (substitui redirectToPayment)
export const startPixPayment = async (planType: 'monthly' | 'yearly', isVip: boolean, userEmail: string) => {
  try {
    console.log('🚀 Iniciando pagamento PIX:', { planType, isVip, userEmail });
    
    // Verificar se as credenciais do Mercado Pago estão configuradas
    const accessToken = import.meta.env.VITE_MERCADO_PAGO_ACCESS_TOKEN;
    const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
    
    if (!accessToken || !publicKey) {
      console.warn('⚠️ Credenciais do Mercado Pago não configuradas');
      toast.error('Sistema PIX não configurado. Consulte a documentação para configurar as credenciais.');
      return null;
    }
    
    if (!userEmail) {
      toast.error('Email do usuário é obrigatório para pagamento PIX');
      return null;
    }
    
    const paymentData: PixPaymentData = {
      planType,
      isVip,
      userEmail
    };
    
    // Criar pagamento PIX real usando a API do Mercado Pago
    const pixPreference = await createPixPayment(paymentData);
    
    console.log('✅ Pagamento PIX real iniciado com sucesso');
    return pixPreference;
    
  } catch (error: any) {
    console.error('❌ Erro ao iniciar pagamento PIX:', error);
    toast.error('Erro ao iniciar pagamento PIX. Tente novamente.');
    return null;
  }
};

// Função para obter informações do plano
export const getPlanInfo = (planType: 'monthly' | 'yearly', isVip: boolean) => {
  const planPrices = {
    monthly: {
      normal: 29.90,
      vip: 49.90
    },
    yearly: {
      normal: 299.90,
      vip: 499.90
    }
  };
  
  const price = isVip ? planPrices[planType].vip : planPrices[planType].normal;
  const planName = `OneDrip ${planType === 'monthly' ? 'Mensal' : 'Anual'}${isVip ? ' VIP' : ''}`;
  
  return {
    name: planName,
    price,
    type: planType,
    isVip
  };
};

// Funções mantidas para compatibilidade (deprecated)
export const redirectToPayment = (planType: 'monthly' | 'yearly', isVip: boolean) => {
  console.warn('⚠️ redirectToPayment está deprecated. Use startPixPayment ao invés.');
  toast.error('Função de pagamento desatualizada. Atualize a página e tente novamente.');
};

export const createPayment = async (data: PixPaymentData) => {
  console.warn('⚠️ createPayment está deprecated. Use createPixPayment ao invés.');
  return createPixPayment(data);
};

export const redirectToCheckout = (initPoint: string) => {
  console.warn('⚠️ redirectToCheckout está deprecated.');
  toast.error('Função de checkout desatualizada. Use o novo sistema PIX.');
};