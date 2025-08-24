// ============================================
// SERVIÇO DE TRANSAÇÕES PIX
// ============================================
// Serviço para gerenciamento de transações PIX

import type {
  PixTransaction,
  PixTransactionStatus,
  TransactionFilters,
  TransactionStatistics
} from '../../shared/types/pix';
import { auditService } from './auditService';
import { securityService } from './securityService';

// Classe principal do serviço de transações PIX
export class PixTransactionService {
  private transactions: Map<string, PixTransaction> = new Map();
  private statusCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.loadTransactionsFromStorage();
    this.startPeriodicStatusCheck();
  }

  // Carregar transações do armazenamento local
  private loadTransactionsFromStorage(): void {
    try {
      const storedTransactions = localStorage.getItem('pix_transactions');
      if (storedTransactions) {
        const transactionArray: PixTransaction[] = JSON.parse(storedTransactions);
        transactionArray.forEach(transaction => {
          // Converter strings de data de volta para objetos Date
          transaction.createdAt = new Date(transaction.createdAt);
          transaction.updatedAt = new Date(transaction.updatedAt);
          transaction.expiresAt = new Date(transaction.expiresAt);
          if (transaction.paidAt) {
            transaction.paidAt = new Date(transaction.paidAt);
          }
          
          this.transactions.set(transaction.id, transaction);
        });
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      this.transactions.clear();
    }
  }

  // Salvar transações no armazenamento local
  private saveTransactionsToStorage(): void {
    try {
      const transactionArray = Array.from(this.transactions.values());
      localStorage.setItem('pix_transactions', JSON.stringify(transactionArray));
    } catch (error) {
      console.error('Erro ao salvar transações:', error);
    }
  }

  // Adicionar nova transação
  async addTransaction(transaction: PixTransaction): Promise<void> {
    try {
      this.transactions.set(transaction.id, transaction);
      this.saveTransactionsToStorage();
      
      // Iniciar monitoramento de status
      this.startStatusMonitoring(transaction.id);
      
      // Log da criação
      await auditService.logPixTransaction(
        'transaction_created',
        transaction.id,
        {
          planType: transaction.planData.type,
          amount: transaction.pixCode.amount,
          isVip: transaction.planData.isVip
        },
        transaction.userEmail
      );
      
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      throw error;
    }
  }

  // Obter transação por ID
  getTransaction(transactionId: string): PixTransaction | undefined {
    return this.transactions.get(transactionId);
  }

  // Obter transações por usuário
  getTransactionsByUser(userEmail: string): PixTransaction[] {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userEmail === userEmail)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Obter transações com filtros
  getTransactions(filters?: TransactionFilters): PixTransaction[] {
    let filteredTransactions = Array.from(this.transactions.values());
    
    if (filters) {
      if (filters.status) {
        filteredTransactions = filteredTransactions.filter(
          transaction => transaction.status === filters.status
        );
      }
      
      if (filters.userEmail) {
        filteredTransactions = filteredTransactions.filter(
          transaction => transaction.userEmail === filters.userEmail
        );
      }
      
      if (filters.planType) {
        filteredTransactions = filteredTransactions.filter(
          transaction => transaction.planData.type === filters.planType
        );
      }
      
      if (filters.startDate) {
        filteredTransactions = filteredTransactions.filter(
          transaction => transaction.createdAt >= filters.startDate!
        );
      }
      
      if (filters.endDate) {
        filteredTransactions = filteredTransactions.filter(
          transaction => transaction.createdAt <= filters.endDate!
        );
      }
      
      if (filters.limit) {
        filteredTransactions = filteredTransactions.slice(0, filters.limit);
      }
    }
    
    return filteredTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Atualizar status da transação
  async updateTransactionStatus(
    transactionId: string, 
    newStatus: PixTransactionStatus,
    additionalData?: Partial<PixTransaction>
  ): Promise<void> {
    try {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        throw new Error(`Transação ${transactionId} não encontrada`);
      }
      
      const oldStatus = transaction.status;
      
      // Atualizar transação
      const updatedTransaction: PixTransaction = {
        ...transaction,
        ...additionalData,
        status: newStatus,
        updatedAt: new Date()
      };
      
      // Se foi paga, definir data de pagamento
      if (newStatus === 'paid' && !updatedTransaction.paidAt) {
        updatedTransaction.paidAt = new Date();
      }
      
      this.transactions.set(transactionId, updatedTransaction);
      this.saveTransactionsToStorage();
      
      // Parar monitoramento se transação foi finalizada
      if (['paid', 'expired', 'cancelled'].includes(newStatus)) {
        this.stopStatusMonitoring(transactionId);
      }
      
      // Log da atualização
      await auditService.logPixTransaction(
        'status_updated',
        transactionId,
        {
          oldStatus,
          newStatus,
          amount: transaction.pixCode.amount
        },
        transaction.userEmail
      );
      
      // Processar ações baseadas no novo status
      await this.processStatusChange(updatedTransaction, oldStatus);
      
    } catch (error) {
      console.error('Erro ao atualizar status da transação:', error);
      throw error;
    }
  }

  // Processar mudanças de status
  private async processStatusChange(
    transaction: PixTransaction, 
    oldStatus: PixTransactionStatus
  ): Promise<void> {
    try {
      switch (transaction.status) {
        case 'paid':
          await this.handlePaymentConfirmed(transaction);
          break;
          
        case 'expired':
          await this.handlePaymentExpired(transaction);
          break;
          
        case 'cancelled':
          await this.handlePaymentCancelled(transaction);
          break;
      }
    } catch (error) {
      console.error('Erro ao processar mudança de status:', error);
    }
  }

  // Processar pagamento confirmado
  private async handlePaymentConfirmed(transaction: PixTransaction): Promise<void> {
    try {
      // Enviar notificação de sucesso
      await this.sendSuccessNotification(transaction);
      
      // Ativar licença do usuário (implementar integração)
      await this.activateUserLicense(transaction);
      
      // Log de sucesso
      await auditService.logPixTransaction(
        'payment_confirmed',
        transaction.id,
        {
          amount: transaction.pixCode.amount,
          planType: transaction.planData.type,
          isVip: transaction.planData.isVip
        },
        transaction.userEmail
      );
      
    } catch (error) {
      console.error('Erro ao processar pagamento confirmado:', error);
    }
  }

  // Processar pagamento expirado
  private async handlePaymentExpired(transaction: PixTransaction): Promise<void> {
    try {
      // Enviar notificação de expiração
      await this.sendExpirationNotification(transaction);
      
      // Log de expiração
      await auditService.logPixTransaction(
        'payment_expired',
        transaction.id,
        {
          amount: transaction.pixCode.amount,
          expiresAt: transaction.expiresAt
        },
        transaction.userEmail
      );
      
    } catch (error) {
      console.error('Erro ao processar pagamento expirado:', error);
    }
  }

  // Processar pagamento cancelado
  private async handlePaymentCancelled(transaction: PixTransaction): Promise<void> {
    try {
      // Log de cancelamento
      await auditService.logPixTransaction(
        'payment_cancelled',
        transaction.id,
        {
          amount: transaction.pixCode.amount,
          reason: 'User cancelled'
        },
        transaction.userEmail
      );
      
    } catch (error) {
      console.error('Erro ao processar pagamento cancelado:', error);
    }
  }

  // Iniciar monitoramento de status
  private startStatusMonitoring(transactionId: string): void {
    // Verificar status a cada 30 segundos
    const interval = setInterval(async () => {
      try {
        await this.checkTransactionStatus(transactionId);
      } catch (error) {
        console.error('Erro ao verificar status da transação:', error);
      }
    }, 30000);
    
    this.statusCheckIntervals.set(transactionId, interval);
  }

  // Parar monitoramento de status
  private stopStatusMonitoring(transactionId: string): void {
    const interval = this.statusCheckIntervals.get(transactionId);
    if (interval) {
      clearInterval(interval);
      this.statusCheckIntervals.delete(transactionId);
    }
  }

  // Verificar status da transação
  private async checkTransactionStatus(transactionId: string): Promise<void> {
    try {
      const transaction = this.transactions.get(transactionId);
      if (!transaction || ['paid', 'expired', 'cancelled'].includes(transaction.status)) {
        this.stopStatusMonitoring(transactionId);
        return;
      }
      
      // Verificar se expirou
      if (new Date() > transaction.expiresAt) {
        await this.updateTransactionStatus(transactionId, 'expired');
        return;
      }
      
      // Aqui seria feita a verificação com o Mercado Pago
      // Por enquanto, simular verificação
      console.log(`Verificando status da transação ${transactionId}`);
      
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  }

  // Iniciar verificação periódica de expiração
  private startPeriodicStatusCheck(): void {
    // Verificar transações expiradas a cada 5 minutos
    setInterval(() => {
      this.checkExpiredTransactions();
    }, 5 * 60 * 1000);
  }

  // Verificar transações expiradas
  private async checkExpiredTransactions(): Promise<void> {
    try {
      const now = new Date();
      const pendingTransactions = Array.from(this.transactions.values())
        .filter(transaction => transaction.status === 'pending' && transaction.expiresAt < now);
      
      for (const transaction of pendingTransactions) {
        await this.updateTransactionStatus(transaction.id, 'expired');
      }
      
    } catch (error) {
      console.error('Erro ao verificar transações expiradas:', error);
    }
  }

  // Enviar notificação de sucesso
  private async sendSuccessNotification(transaction: PixTransaction): Promise<void> {
    try {
      // Implementar envio de notificação (email, WhatsApp, etc.)
      console.log(`Pagamento confirmado para ${transaction.userEmail}`);
      
      // Simular envio de WhatsApp
      const message = `🎉 Pagamento confirmado! Seu plano ${transaction.planData.name} foi ativado com sucesso. Obrigado por escolher a OneDrip!`;
      console.log(`WhatsApp para ${transaction.whatsappNumber}: ${message}`);
      
    } catch (error) {
      console.error('Erro ao enviar notificação de sucesso:', error);
    }
  }

  // Enviar notificação de expiração
  private async sendExpirationNotification(transaction: PixTransaction): Promise<void> {
    try {
      const message = `⏰ Seu código PIX expirou. Gere um novo código para continuar com sua assinatura OneDrip.`;
      console.log(`WhatsApp para ${transaction.whatsappNumber}: ${message}`);
      
    } catch (error) {
      console.error('Erro ao enviar notificação de expiração:', error);
    }
  }

  // Ativar licença do usuário
  private async activateUserLicense(transaction: PixTransaction): Promise<void> {
    try {
      // Implementar ativação da licença
      console.log(`Ativando licença para ${transaction.userEmail}`);
      
      // Aqui seria feita a integração com o sistema de licenças
      // Por exemplo, atualizar banco de dados, enviar email de boas-vindas, etc.
      
    } catch (error) {
      console.error('Erro ao ativar licença:', error);
    }
  }

  // Obter estatísticas das transações
  getStatistics(): TransactionStatistics {
    const transactions = Array.from(this.transactions.values());
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const stats: TransactionStatistics = {
      total: transactions.length,
      pending: transactions.filter(t => t.status === 'pending').length,
      paid: transactions.filter(t => t.status === 'paid').length,
      expired: transactions.filter(t => t.status === 'expired').length,
      cancelled: transactions.filter(t => t.status === 'cancelled').length,
      totalAmount: transactions
        .filter(t => t.status === 'paid')
        .reduce((sum, t) => sum + t.pixCode.amount, 0),
      averageAmount: 0,
      last24Hours: transactions.filter(t => t.createdAt >= last24Hours).length,
      last7Days: transactions.filter(t => t.createdAt >= last7Days).length,
      last30Days: transactions.filter(t => t.createdAt >= last30Days).length
    };
    
    stats.averageAmount = stats.paid > 0 ? stats.totalAmount / stats.paid : 0;
    
    return stats;
  }

  // Limpar transações antigas
  clearOldTransactions(olderThanDays: number = 90): number {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const initialCount = this.transactions.size;
    
    for (const [id, transaction] of this.transactions.entries()) {
      if (transaction.createdAt < cutoffDate && ['paid', 'expired', 'cancelled'].includes(transaction.status)) {
        this.transactions.delete(id);
        this.stopStatusMonitoring(id);
      }
    }
    
    this.saveTransactionsToStorage();
    
    const removedCount = initialCount - this.transactions.size;
    console.log(`Removidas ${removedCount} transações antigas`);
    
    return removedCount;
  }
}

// Instância singleton do serviço
export const pixTransactionService = new PixTransactionService();

export default pixTransactionService;