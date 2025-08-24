// ============================================
// TIPOS TYPESCRIPT PARA SISTEMA PIX
// ============================================
// Tipos compartilhados entre frontend e backend

// Status possíveis de uma transação PIX
export type PixTransactionStatus = 
  | 'pending'     // Aguardando pagamento
  | 'processing' // Processando pagamento
  | 'approved'   // Pagamento aprovado
  | 'rejected'   // Pagamento rejeitado
  | 'cancelled'  // Pagamento cancelado
  | 'expired';   // Código PIX expirado

// Tipos de plano disponíveis
export type PlanType = 'monthly' | 'yearly';

// Dados do plano selecionado
export interface PlanData {
  id: string;
  name: string;
  type: PlanType;
  price: number;
  originalPrice?: number;
  currency: string;
  period: string;
  isVip: boolean;
  vipPrice?: number;
}

// Dados do código PIX gerado
export interface PixCode {
  id: string;
  code: string;           // Código PIX para copia e cola
  qrCodeBase64: string;   // QR Code em base64
  expiresAt: Date;        // Data de expiração (24h)
  amount: number;         // Valor da transação
  description: string;    // Descrição da transação
}

// Dados da transação PIX
export interface PixTransaction {
  id: string;
  userId: string;
  userEmail: string;
  planData: PlanData;
  pixCode: PixCode;
  status: PixTransactionStatus;
  mercadoPagoId?: string;     // ID da transação no Mercado Pago
  mercadoPagoPaymentId?: string; // ID do pagamento no Mercado Pago
  paymentProof?: string;      // URL do comprovante enviado pelo usuário
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;              // Data do pagamento
  expiresAt: Date;            // Data de expiração
  notificationSent: boolean;  // Se notificação foi enviada
  whatsappNumber?: string;    // Número para envio do comprovante
}

// Dados para criação de transação PIX
export interface CreatePixTransactionRequest {
  planType: PlanType;
  isVip: boolean;
  userEmail: string;
  userId?: string;
}

// Resposta da criação de transação PIX
export interface CreatePixTransactionResponse {
  transaction: PixTransaction;
  redirectUrl: string;  // URL para página de pagamento
}

// Dados para verificação de status
export interface PixStatusRequest {
  transactionId: string;
}

// Resposta da verificação de status
export interface PixStatusResponse {
  transaction: PixTransaction;
  isExpired: boolean;
  timeRemaining: number; // Tempo restante em segundos
}

// Dados para webhook do Mercado Pago
export interface MercadoPagoWebhook {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: number;
  user_id: string;
  version: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

// Dados do pagamento do Mercado Pago
export interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  currency_id: string;
  date_created: string;
  date_approved?: string;
  external_reference?: string;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  payment_method: {
    id: string;
    type: string;
  };
}

// Configuração do Mercado Pago
export interface MercadoPagoConfig {
  accessToken: string;
  publicKey: string;
  webhookUrl: string;
  notificationUrl: string;
}

// Dados para envio de comprovante
export interface PaymentProofRequest {
  transactionId: string;
  proofImageUrl: string;
  userMessage?: string;
}

// Resposta do envio de comprovante
export interface PaymentProofResponse {
  success: boolean;
  message: string;
  whatsappNumber: string;
}

// Dados para notificação WhatsApp
export interface WhatsAppNotification {
  to: string;
  message: string;
  transactionId: string;
  type: 'payment_received' | 'payment_expired' | 'proof_request';
}

// Configurações de segurança
export interface SecurityConfig {
  encryptionKey: string;
  jwtSecret: string;
  webhookSecret: string;
}

// Dados criptografados
export interface EncryptedData {
  data: string;      // Dados criptografados
  iv: string;        // Vetor de inicialização
  timestamp: number; // Timestamp para validação
}

// Log de auditoria
export interface AuditLog {
  id: string;
  transactionId: string;
  action: string;
  details: Record<string, any>;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Estatísticas de transações
export interface TransactionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  totalAmount: number;
  averageAmount: number;
  conversionRate: number;
}

// Filtros para busca de transações
export interface TransactionFilters {
  status?: PixTransactionStatus[];
  planType?: PlanType[];
  dateFrom?: Date;
  dateTo?: Date;
  userEmail?: string;
  minAmount?: number;
  maxAmount?: number;
  isVip?: boolean;
}

// Resultado paginado de transações
export interface PaginatedTransactions {
  transactions: PixTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Configurações do sistema PIX
export interface PixSystemConfig {
  enabled: boolean;
  mercadoPago: MercadoPagoConfig;
  security: SecurityConfig;
  whatsappNumber: string;
  expirationHours: number;
  maxRetries: number;
  notificationDelay: number;
}

export default {
  PixTransactionStatus,
  PlanType,
  PlanData,
  PixCode,
  PixTransaction,
  CreatePixTransactionRequest,
  CreatePixTransactionResponse,
  PixStatusRequest,
  PixStatusResponse,
  MercadoPagoWebhook,
  MercadoPagoPayment,
  MercadoPagoConfig,
  PaymentProofRequest,
  PaymentProofResponse,
  WhatsAppNotification,
  SecurityConfig,
  EncryptedData,
  AuditLog,
  TransactionStats,
  TransactionFilters,
  PaginatedTransactions,
  PixSystemConfig
};