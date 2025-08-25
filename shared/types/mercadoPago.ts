export interface MercadoPagoPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  duration: string;
  features: string[];
  isPopular?: boolean;
  mercadoPagoUrl: string;
  planType: 'monthly' | 'monthly_premium' | 'annual' | 'annual_vip';
}

export interface PaymentInstruction {
  planId: string;
  planName: string;
  planPrice: string;
  whatsappNumber: string;
  instructions: string[];
}

export interface MercadoPagoConfig {
  plans: {
    monthly: string; // https://mpago.li/2ZqAPDs
    monthly_premium: string; // https://mpago.li/2A351iP
    annual: string; // https://mpago.li/1c4LGhc
    annual_vip: string; // https://mpago.li/1x254ne
  };
  whatsappNumber: string;
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: MercadoPagoPlan | null;
  onPaymentRedirect: (url: string) => void;
}

export interface PlanCardProps {
  plan: MercadoPagoPlan;
  isSelected: boolean;
  onSelect: (plan: MercadoPagoPlan) => void;
}

export interface PaymentFlowState {
  selectedPlan: MercadoPagoPlan | null;
  showInstructions: boolean;
  isProcessing: boolean;
  error: string | null;
}