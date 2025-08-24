const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const crypto = require('crypto');
const path = require('path');
const pixTransactionIntegration = require('./services/pixTransactionIntegration');

// Carregar variáveis de ambiente do arquivo .env.local na raiz do projeto
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do CORS
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware para parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do Mercado Pago
let mercadoPagoClient;
try {
  if (process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    mercadoPagoClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
      options: {
        timeout: 5000,
        idempotencyKey: 'abc'
      }
    });
    console.log('✅ Mercado Pago configurado com sucesso');
  } else {
    console.warn('⚠️ MERCADO_PAGO_ACCESS_TOKEN não encontrado');
  }
} catch (error) {
  console.error('❌ Erro ao configurar Mercado Pago:', error.message);
}

// Função para validar webhook signature
function validateWebhookSignature(body, signature) {
  if (!process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
    console.warn('⚠️ MERCADO_PAGO_WEBHOOK_SECRET não configurado');
    return true; // Permitir em desenvolvimento
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.MERCADO_PAGO_WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('❌ Erro ao validar signature:', error.message);
    return false;
  }
}

// Função para atualizar status da transação
async function updateTransactionStatus(paymentId, status, paymentData = {}) {
  try {
    console.log(`🔄 Atualizando transação ${paymentId} para status: ${status}`);
    
    // Integrar com o pixTransactionService através do módulo de integração
    const success = await pixTransactionIntegration.updateTransactionStatus(
      paymentId, 
      status, 
      {
        mercadoPagoPaymentId: paymentId,
        paymentData: paymentData,
        webhookProcessedAt: new Date().toISOString()
      }
    );
    
    if (success) {
      console.log(`✅ Status da transação ${paymentId} atualizado para: ${status}`);
    } else {
      console.warn(`⚠️ Não foi possível atualizar a transação ${paymentId}`);
    }
    
    return success;
  } catch (error) {
    console.error(`❌ Erro ao atualizar transação ${paymentId}:`, error.message);
    return false;
  }
}

// Função para processar notificação do Mercado Pago
async function processPaymentNotification(paymentId) {
  try {
    if (!mercadoPagoClient) {
      throw new Error('Mercado Pago não configurado');
    }

    const payment = new Payment(mercadoPagoClient);
    const paymentData = await payment.get({ id: paymentId });
    
    console.log(`📋 Dados do pagamento ${paymentId}:`, {
      id: paymentData.id,
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      payment_method_id: paymentData.payment_method_id,
      transaction_amount: paymentData.transaction_amount
    });

    // Mapear status do Mercado Pago para status interno
    let internalStatus;
    switch (paymentData.status) {
      case 'approved':
        internalStatus = 'confirmed';
        break;
      case 'pending':
        internalStatus = 'pending';
        break;
      case 'cancelled':
      case 'rejected':
        internalStatus = 'failed';
        break;
      default:
        internalStatus = 'pending';
    }

    // Atualizar status da transação
    await updateTransactionStatus(paymentId, internalStatus, {
      mercadoPagoStatus: paymentData.status,
      statusDetail: paymentData.status_detail,
      paymentMethodId: paymentData.payment_method_id,
      transactionAmount: paymentData.transaction_amount,
      dateApproved: paymentData.date_approved,
      dateCreated: paymentData.date_created,
      lastModified: paymentData.date_last_updated
    });
    
    return { success: true, status: internalStatus };
  } catch (error) {
    console.error(`❌ Erro ao processar notificação do pagamento ${paymentId}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Endpoint principal para webhooks PIX
app.post('/api/pix/webhook', async (req, res) => {
  try {
    console.log('🔔 Webhook PIX recebido:', {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const signature = req.headers['x-signature'] || req.headers['x-hub-signature-256'];
    
    // Validar signature se configurada
    if (process.env.MERCADO_PAGO_WEBHOOK_SECRET && signature) {
      if (!validateWebhookSignature(req.body, signature)) {
        console.error('❌ Signature inválida');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { action, api_version, data, date_created, id, live_mode, type, user_id } = req.body;

    // Processar apenas notificações de pagamento
    if (type === 'payment' && data && data.id) {
      const result = await processPaymentNotification(data.id);
      
      if (result.success) {
        console.log(`✅ Webhook processado com sucesso para pagamento ${data.id}`);
        return res.status(200).json({ 
          message: 'Webhook processed successfully',
          payment_id: data.id,
          status: result.status
        });
      } else {
        console.error(`❌ Erro ao processar webhook para pagamento ${data.id}:`, result.error);
        return res.status(500).json({ 
          error: 'Failed to process webhook',
          payment_id: data.id,
          details: result.error
        });
      }
    }

    // Para outros tipos de notificação, apenas confirmar recebimento
    console.log(`ℹ️ Tipo de notificação não processada: ${type}`);
    return res.status(200).json({ message: 'Webhook received but not processed', type });

  } catch (error) {
    console.error('❌ Erro no webhook PIX:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Endpoint alternativo para notificações do Mercado Pago
app.post('/api/notifications/mercadopago', async (req, res) => {
  try {
    console.log('🔔 Notificação Mercado Pago recebida:', {
      query: req.query,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const { topic, id } = req.query;
    
    if (topic === 'payment' && id) {
      const result = await processPaymentNotification(id);
      
      if (result.success) {
        console.log(`✅ Notificação processada com sucesso para pagamento ${id}`);
        return res.status(200).json({ 
          message: 'Notification processed successfully',
          payment_id: id,
          status: result.status
        });
      } else {
        console.error(`❌ Erro ao processar notificação para pagamento ${id}:`, result.error);
        return res.status(500).json({ 
          error: 'Failed to process notification',
          payment_id: id,
          details: result.error
        });
      }
    }

    console.log(`ℹ️ Tópico não processado: ${topic}`);
    return res.status(200).json({ message: 'Notification received but not processed', topic });

  } catch (error) {
    console.error('❌ Erro na notificação Mercado Pago:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Endpoint de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mercadoPagoConfigured: !!mercadoPagoClient,
    webhookSecretConfigured: !!process.env.MERCADO_PAGO_WEBHOOK_SECRET
  });
});

// Endpoint para testar configuração
app.get('/api/config', (req, res) => {
  res.json({
    port: PORT,
    nodeEnv: process.env.NODE_ENV || 'development',
    mercadoPagoConfigured: !!process.env.MERCADO_PAGO_ACCESS_TOKEN,
    webhookSecretConfigured: !!process.env.MERCADO_PAGO_WEBHOOK_SECRET,
    corsOrigins: ['http://localhost:8081', 'http://localhost:3000', 'http://localhost:5173']
  });
});

// Endpoint para obter estatísticas das transações
app.get('/api/transactions/stats', (req, res) => {
  try {
    const stats = pixTransactionIntegration.getTransactionStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error.message);
    res.status(500).json({ error: 'Failed to get transaction stats' });
  }
});

// Endpoint para obter transação por ID
app.get('/api/transactions/:id', (req, res) => {
  try {
    const transaction = pixTransactionIntegration.getTransaction(req.params.id);
    if (transaction) {
      res.json(transaction);
    } else {
      res.status(404).json({ error: 'Transaction not found' });
    }
  } catch (error) {
    console.error('❌ Erro ao obter transação:', error.message);
    res.status(500).json({ error: 'Failed to get transaction' });
  }
});

// Endpoint para limpar transações antigas
app.post('/api/transactions/cleanup', (req, res) => {
  try {
    const { olderThanDays = 90 } = req.body;
    const removedCount = pixTransactionIntegration.cleanOldTransactions(olderThanDays);
    res.json({ message: `Removed ${removedCount} old transactions` });
  } catch (error) {
    console.error('❌ Erro ao limpar transações:', error.message);
    res.status(500).json({ error: 'Failed to cleanup transactions' });
  }
});

// Endpoint para verificar transações expiradas
app.post('/api/transactions/check-expired', (req, res) => {
  try {
    const expiredCount = pixTransactionIntegration.checkExpiredTransactions();
    res.json({ message: `Marked ${expiredCount} transactions as expired` });
  } catch (error) {
    console.error('❌ Erro ao verificar transações expiradas:', error.message);
    res.status(500).json({ error: 'Failed to check expired transactions' });
  }
});

// Endpoint para criar preferência PIX
app.post('/api/pix/create-preference', async (req, res) => {
  try {
    console.log('🔄 Criando preferência PIX:', req.body);
    
    if (!mercadoPagoClient) {
      return res.status(500).json({ error: 'Mercado Pago não configurado' });
    }

    const { planType, isVip, userEmail } = req.body;
    
    // Validar parâmetros
    if (!planType || !userEmail) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios: planType, userEmail' });
    }

    // Definir valores dos planos
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

    if (!planPrices[planType]) {
      return res.status(400).json({ error: 'Tipo de plano inválido' });
    }

    const price = isVip ? planPrices[planType].vip : planPrices[planType].normal;
    const planName = `OneDrip ${planType === 'monthly' ? 'Mensal' : 'Anual'}${isVip ? ' VIP' : ''}`;
    
    // Criar preferência
    const preference = new Preference(mercadoPagoClient);
    
    const preferenceData = {
      items: [{
        id: `onedrip-${planType}-${isVip ? 'vip' : 'normal'}`,
        title: planName,
        description: `Plano ${planName} - OneDrip Blueberry`,
        quantity: 1,
        unit_price: price,
        currency_id: 'BRL'
      }],
      payer: {
        email: userEmail
      },
      payment_methods: {
        excluded_payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' },
          { id: 'ticket' }
        ],
        included_payment_methods: [
          { id: 'pix' }
        ]
      },
      notification_url: `http://localhost:${PORT}/api/pix/webhook`,
      back_urls: {
        success: 'http://localhost:8080/payment-success',
        failure: 'http://localhost:8080/payment-failure',
        pending: 'http://localhost:8080/payment-status'
      },
      external_reference: `onedrip-${Date.now()}-${planType}-${isVip ? 'vip' : 'normal'}`,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
    };

    const result = await preference.create({ body: preferenceData });
    
    console.log('✅ Preferência PIX criada:', {
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point
    });

    // Registrar transação no sistema interno
    const transactionId = result.external_reference;
    await pixTransactionIntegration.createTransaction({
      id: transactionId,
      preferenceId: result.id,
      planType,
      isVip,
      userEmail,
      amount: price,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });

    res.json({
      success: true,
      preference_id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      qr_code: result.qr_code,
      qr_code_base64: result.qr_code_base64,
      transaction_id: transactionId,
      amount: price,
      expires_at: preferenceData.expiration_date_to
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar preferência PIX:', error.message);
    res.status(500).json({ 
      error: 'Erro ao criar preferência PIX',
      message: error.message
    });
  }
});

// Endpoint para verificar status de pagamento
app.get('/api/pix/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // Buscar transação no sistema interno
    const transaction = pixTransactionIntegration.getTransaction(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    res.json({
      transaction_id: transactionId,
      status: transaction.status,
      amount: transaction.amount,
      plan_type: transaction.planType,
      is_vip: transaction.isVip,
      created_at: transaction.createdAt,
      expires_at: transaction.expiresAt,
      updated_at: transaction.updatedAt
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
    res.status(500).json({ 
      error: 'Erro ao verificar status',
      message: error.message
    });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('❌ Erro não tratado:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚙️ Config: http://localhost:${PORT}/api/config`);
  console.log(`🔗 Webhook PIX: http://localhost:${PORT}/api/pix/webhook`);
  console.log(`🔗 Notificações MP: http://localhost:${PORT}/api/notifications/mercadopago`);
  
  // Verificar configuração
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    console.warn('⚠️ MERCADO_PAGO_ACCESS_TOKEN não configurado');
  }
  if (!process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
    console.warn('⚠️ MERCADO_PAGO_WEBHOOK_SECRET não configurado');
  }
});

module.exports = app;