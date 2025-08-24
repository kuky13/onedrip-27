import axios from 'axios';
import { toast } from 'sonner';

const API_URL = 'http://localhost:3001';

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
    
    const response = await axios.post(`${API_URL}/api/pix/create-preference`, data);
    
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

// Função para verificar status do pagamento
export const checkPaymentStatus = async (transactionId: string): Promise<PaymentStatus> => {
  try {
    console.log('🔍 Verificando status do pagamento:', transactionId);
    
    const response = await axios.get(`${API_URL}/api/pix/status/${transactionId}`);
    
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
    
    // Por enquanto, simular resposta para demonstração
    const mockPreference: PixPreferenceResponse = {
      success: true,
      preference_id: `pref_${Date.now()}`,
      init_point: '#',
      sandbox_init_point: '#',
      qr_code: 'pix_code_example',
      qr_code_base64: 'data:image/png;base64,example',
      transaction_id: `tx_${Date.now()}`,
      amount: getPlanInfo(planType, isVip).price,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    console.log('✅ Pagamento PIX simulado iniciado com sucesso');
    return mockPreference;
    
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