import axios from 'axios';
import { toast } from 'sonner';
import { safeRedirect, isUrlSafe } from '@/utils/secureNavigation';

const API_URL = 'http://localhost:3001';

// Links específicos do Mercado Pago para cada tipo de plano
const PAYMENT_LINKS = {
  monthly: {
    normal: 'mpago.li/2ZqAPDs',
    vip: 'mpago.li/2A351iP'
  },
  yearly: {
    normal: 'mpago.li/1c4LGhc',
    vip: 'mpago.li/1x254ne'
  }
};

// Nova função para redirecionamento direto baseado no plano e VIP
export const redirectToPayment = (planType: 'monthly' | 'yearly', isVip: boolean) => {
  try {
    console.log('redirectToPayment called with:', { planType, isVip });
    
    // Validação dos parâmetros
    if (!planType || !PAYMENT_LINKS[planType]) {
      throw new Error(`Tipo de plano inválido: ${planType}`);
    }
    
    const link = isVip ? PAYMENT_LINKS[planType].vip : PAYMENT_LINKS[planType].normal;
    
    if (!link) {
      throw new Error(`Link não encontrado para plano: ${planType}, VIP: ${isVip}`);
    }
    
    // Adiciona https:// se não estiver presente
    const fullLink = link.startsWith('http') ? link : `https://${link}`;
    
    console.log(`Redirecionando para: ${fullLink} (Plano: ${planType}, VIP: ${isVip})`);
    if (isUrlSafe(fullLink)) {
      safeRedirect(fullLink, '/dashboard');
    } else {
      toast.error('Link de pagamento inválido');
    }
  } catch (error) {
    console.error('Erro ao redirecionar para pagamento:', error);
    alert('Erro ao processar pagamento. Tente novamente.');
  }
};

// Função mantida para compatibilidade (caso ainda seja usada em outros lugares)
export const createPayment = async (data: {
  planType: 'monthly' | 'yearly';
  isVip: boolean;
  userEmail: string;
}) => {
  const response = await axios.post(`${API_URL}/api/payment/create-preference`, data);
  return response.data;
};

// Função mantida para compatibilidade
export const redirectToCheckout = (initPoint: string) => {
  if (isUrlSafe(initPoint)) {
    safeRedirect(initPoint, '/dashboard');
  } else {
    toast.error('Link de pagamento inválido');
  }
};