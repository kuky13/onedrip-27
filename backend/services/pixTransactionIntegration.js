const fs = require('fs');
const path = require('path');

/**
 * Serviço de integração com o pixTransactionService do frontend
 * Este módulo permite ao backend atualizar transações PIX no localStorage do frontend
 */
class PixTransactionIntegration {
  constructor() {
    this.frontendStoragePath = path.join(__dirname, '..', '..', 'storage', 'pix_transactions.json');
    this.ensureStorageDirectory();
  }

  // Garantir que o diretório de storage existe
  ensureStorageDirectory() {
    const storageDir = path.dirname(this.frontendStoragePath);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
  }

  // Carregar transações do arquivo
  loadTransactions() {
    try {
      if (fs.existsSync(this.frontendStoragePath)) {
        const data = fs.readFileSync(this.frontendStoragePath, 'utf8');
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('❌ Erro ao carregar transações:', error.message);
      return [];
    }
  }

  // Salvar transações no arquivo
  saveTransactions(transactions) {
    try {
      fs.writeFileSync(this.frontendStoragePath, JSON.stringify(transactions, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar transações:', error.message);
      return false;
    }
  }

  // Encontrar transação por ID do pagamento do Mercado Pago
  findTransactionByPaymentId(paymentId) {
    const transactions = this.loadTransactions();
    return transactions.find(transaction => 
      transaction.mercadoPagoPaymentId === paymentId ||
      transaction.id === paymentId ||
      transaction.pixCode?.paymentId === paymentId
    );
  }

  // Atualizar status da transação
  async updateTransactionStatus(paymentId, newStatus, additionalData = {}) {
    try {
      console.log(`🔄 Procurando transação para pagamento ${paymentId}`);
      
      const transactions = this.loadTransactions();
      const transactionIndex = transactions.findIndex(transaction => 
        transaction.mercadoPagoPaymentId === paymentId ||
        transaction.id === paymentId ||
        transaction.pixCode?.paymentId === paymentId
      );

      if (transactionIndex === -1) {
        console.warn(`⚠️ Transação não encontrada para pagamento ${paymentId}`);
        return false;
      }

      const transaction = transactions[transactionIndex];
      const oldStatus = transaction.status;

      // Mapear status do Mercado Pago para status interno
      const statusMapping = {
        'approved': 'paid',
        'pending': 'pending',
        'cancelled': 'cancelled',
        'rejected': 'cancelled',
        'refunded': 'cancelled',
        'charged_back': 'cancelled'
      };

      const mappedStatus = statusMapping[newStatus] || newStatus;

      // Atualizar transação
      const updatedTransaction = {
        ...transaction,
        ...additionalData,
        status: mappedStatus,
        updatedAt: new Date().toISOString()
      };

      // Se foi paga, definir data de pagamento
      if (mappedStatus === 'paid' && !updatedTransaction.paidAt) {
        updatedTransaction.paidAt = new Date().toISOString();
      }

      // Atualizar no array
      transactions[transactionIndex] = updatedTransaction;

      // Salvar no arquivo
      const saved = this.saveTransactions(transactions);
      
      if (saved) {
        console.log(`✅ Transação ${transaction.id} atualizada de '${oldStatus}' para '${mappedStatus}'`);
        
        // Log adicional para debug
        console.log(`📋 Detalhes da atualização:`, {
          transactionId: transaction.id,
          paymentId,
          oldStatus,
          newStatus: mappedStatus,
          userEmail: transaction.userEmail,
          amount: transaction.pixCode?.amount
        });
        
        return true;
      } else {
        console.error(`❌ Falha ao salvar transação ${transaction.id}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Erro ao atualizar transação para pagamento ${paymentId}:`, error.message);
      return false;
    }
  }

  // Criar nova transação
  createTransaction(transactionData) {
    try {
      const transactions = this.loadTransactions();
      
      // Gerar ID único se não fornecido
      if (!transactionData.id) {
        transactionData.id = `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Adicionar timestamps
      const now = new Date().toISOString();
      const newTransaction = {
        ...transactionData,
        createdAt: now,
        updatedAt: now,
        status: transactionData.status || 'pending'
      };
      
      // Adicionar à lista
      transactions.push(newTransaction);
      
      // Salvar no arquivo
      const saved = this.saveTransactions(transactions);
      
      if (saved) {
        console.log(`✅ Nova transação criada: ${newTransaction.id}`);
        return newTransaction;
      } else {
        console.error(`❌ Falha ao salvar nova transação`);
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao criar transação:', error.message);
      return null;
    }
  }

  // Obter transação por ID
  getTransaction(transactionId) {
    const transactions = this.loadTransactions();
    return transactions.find(transaction => transaction.id === transactionId);
  }

  // Obter transações por usuário
  getTransactionsByUser(userEmail) {
    const transactions = this.loadTransactions();
    return transactions
      .filter(transaction => transaction.userEmail === userEmail)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Obter estatísticas das transações
  getTransactionStats() {
    const transactions = this.loadTransactions();
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const stats = {
      total: transactions.length,
      pending: transactions.filter(t => t.status === 'pending').length,
      paid: transactions.filter(t => t.status === 'paid').length,
      cancelled: transactions.filter(t => t.status === 'cancelled').length,
      expired: transactions.filter(t => t.status === 'expired').length,
      last24Hours: transactions.filter(t => new Date(t.createdAt) >= last24Hours).length,
      totalAmount: transactions
        .filter(t => t.status === 'paid')
        .reduce((sum, t) => sum + (t.pixCode?.amount || 0), 0)
    };

    return stats;
  }

  // Limpar transações antigas
  cleanOldTransactions(olderThanDays = 90) {
    try {
      const transactions = this.loadTransactions();
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      
      const filteredTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        const isOld = transactionDate < cutoffDate;
        const isFinalized = ['paid', 'expired', 'cancelled'].includes(transaction.status);
        
        return !(isOld && isFinalized);
      });

      const removedCount = transactions.length - filteredTransactions.length;
      
      if (removedCount > 0) {
        this.saveTransactions(filteredTransactions);
        console.log(`🧹 Removidas ${removedCount} transações antigas`);
      }
      
      return removedCount;
    } catch (error) {
      console.error('❌ Erro ao limpar transações antigas:', error.message);
      return 0;
    }
  }

  // Verificar transações expiradas
  checkExpiredTransactions() {
    try {
      const transactions = this.loadTransactions();
      const now = new Date();
      let updatedCount = 0;

      const updatedTransactions = transactions.map(transaction => {
        if (transaction.status === 'pending' && new Date(transaction.expiresAt) < now) {
          updatedCount++;
          return {
            ...transaction,
            status: 'expired',
            updatedAt: now.toISOString()
          };
        }
        return transaction;
      });

      if (updatedCount > 0) {
        this.saveTransactions(updatedTransactions);
        console.log(`⏰ Marcadas ${updatedCount} transações como expiradas`);
      }

      return updatedCount;
    } catch (error) {
      console.error('❌ Erro ao verificar transações expiradas:', error.message);
      return 0;
    }
  }
}

// Instância singleton
const pixTransactionIntegration = new PixTransactionIntegration();

module.exports = pixTransactionIntegration;