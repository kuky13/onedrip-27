// ============================================
// EXPORTAÇÕES DOS COMPONENTES PIX
// ============================================
// Arquivo de índice para facilitar importações dos componentes PIX

export { default as PixSelector } from './PixSelector';
export { default as PixPaymentInterface } from './PixPaymentInterface';
export { default as QRCodeDisplay } from './QRCodeDisplay';

// Re-exportar tipos relacionados
export type {
  PlanData,
  PlanType,
  PlanPeriod,
  PixTransaction,
  PixTransactionStatus,
  PixCode
} from '../../../shared/types/pix';