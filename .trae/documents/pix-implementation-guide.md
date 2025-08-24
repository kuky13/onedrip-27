# Guia de Implementação - Sistema PIX OneDrip

## 1. Visão Geral da Implementação

Este documento fornece um guia prático passo a passo para implementar o sistema de pagamentos PIX no OneDrip, mantendo a estrutura atual e adicionando as novas funcionalidades de forma incremental.

## 2. Fase 1: Preparação do Ambiente

### 2.1 Instalação de Dependências

```bash
# Instalar SDK do Mercado Pago
npm install mercadopago

# Instalar bibliotecas para QR Code
npm install qrcode @types/qrcode

# Instalar bibliotecas para manipulação de datas
npm install date-fns

# Instalar bibliotecas para criptografia (se necessário)
npm install crypto-js @types/crypto-js
```

### 2.2 Configuração de Variáveis de Ambiente

```env
# .env.local
VITE_MERCADO_PAGO_PUBLIC_KEY=TEST-1234567890-123456-abcdef123456789-12345678
MERCADO_PAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdef123456789-12345678
MERCADO_PAGO_WEBHOOK_SECRET=your-webhook-secret-key
VITE_PIX_EXPIRATION_HOURS=24
VITE_WHATSAPP_COMPROVANTE=64996028022
```

## 3. Fase 2: Estrutura de Tipos TypeScript

### 3.1 Tipos para PIX

```typescript
// src/types/pix.ts
export interface PixTransaction {
  id: string;
  user_id: string;
  mercado_pago_id?: string;
  plan_type: 'monthly' | 'yearly';
  is_vip: boolean;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  qr_code?: string;
  pix_code?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface CreatePixPaymentData {
  planType: 'monthly' | 'yearly';
  isVip: boolean;
  userEmail: string;
  amount: number;
}

export interface PixPaymentResponse {
  transactionId: string;
  qrCode: string;
  pixCode: string;
  expiresAt: string;
  amount: number;
  mercadoPagoId: string;
}

export interface TransactionStatus {
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  updatedAt: string;
}
```

## 4. Fase 3: Serviços de Backend

### 4.1 Serviço do Mercado Pago

```typescript
// src/services/mercadoPagoService.ts
import { MercadoPagoConfig, Payment } from 'mercadopago';
import QRCode from 'qrcode';

const client = new MercadoPagoConfig({
  accessToken: import.meta.env.MERCADO_PAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
});

const payment = new Payment(client);

export interface CreatePixPaymentParams {
  amount: number;
  description: string;
  userEmail: string;
  externalReference: string;
}

export const createPixPayment = async (params: CreatePixPaymentParams) => {
  try {
    const paymentData = {
      transaction_amount: params.amount,
      description: params.description,
      payment_method_id: 'pix',
      payer: {
        email: params.userEmail,
      },
      external_reference: params.externalReference,
      date_of_expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      notification_url: `${window.location.origin}/api/pix/webhook`,
    };

    const response = await payment.create({ body: paymentData });
    
    if (response.point_of_interaction?.transaction_data) {
      const qrCodeData = response.point_of_interaction.transaction_data.qr_code;
      const qrCodeBase64 = await QRCode.toDataURL(qrCodeData);
      
      return {
        id: response.id,
        qrCode: qrCodeBase64,
        pixCode: response.point_of_interaction.transaction_data.qr_code_base64,
        expiresAt: response.date_of_expiration,
        status: response.status
      };
    }
    
    throw new Error('Erro ao gerar dados PIX');
  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error);
    throw error;
  }
};

export const getPaymentStatus = async (paymentId: string) => {
  try {
    const response = await payment.get({ id: paymentId });
    return {
      status: response.status,
      updatedAt: response.date_last_updated
    };
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    throw error;
  }
};
```

### 4.2 Serviço de Transações PIX

```typescript
// src/services/pixService.ts
import { supabase } from '@/integrations/supabase/client';
import { createPixPayment, getPaymentStatus } from './mercadoPagoService';
import { CreatePixPaymentData, PixTransaction, PixPaymentResponse } from '@/types/pix';
import { PLANS_CONTENT } from '@/plans/data/content';

export const createPixTransaction = async (data: CreatePixPaymentData): Promise<PixPaymentResponse> => {
  try {
    // 1. Calcular valor total
    const basePrice = data.planType === 'yearly' 
      ? PLANS_CONTENT.planos.anual.preco 
      : PLANS_CONTENT.planos.mensal.preco;
    
    const vipPrice = data.isVip ? PLANS_CONTENT.vip.preco_adicional : 0;
    const totalAmount = basePrice + vipPrice;
    
    // 2. Criar transação no banco
    const { data: transaction, error: dbError } = await supabase
      .from('pix_transactions')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        plan_type: data.planType,
        is_vip: data.isVip,
        amount: totalAmount,
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();
    
    if (dbError) throw dbError;
    
    // 3. Criar pagamento no Mercado Pago
    const planName = data.planType === 'yearly' ? 'Anual' : 'Mensal';
    const vipText = data.isVip ? ' + VIP' : '';
    const description = `OneDrip ${planName}${vipText}`;
    
    const mpPayment = await createPixPayment({
      amount: totalAmount,
      description,
      userEmail: data.userEmail,
      externalReference: transaction.id
    });
    
    // 4. Atualizar transação com dados do MP
    const { error: updateError } = await supabase
      .from('pix_transactions')
      .update({
        mercado_pago_id: mpPayment.id?.toString(),
        qr_code: mpPayment.qrCode,
        pix_code: mpPayment.pixCode
      })
      .eq('id', transaction.id);
    
    if (updateError) throw updateError;
    
    return {
      transactionId: transaction.id,
      qrCode: mpPayment.qrCode,
      pixCode: mpPayment.pixCode || '',
      expiresAt: mpPayment.expiresAt || '',
      amount: totalAmount,
      mercadoPagoId: mpPayment.id?.toString() || ''
    };
    
  } catch (error) {
    console.error('Erro ao criar transação PIX:', error);
    throw error;
  }
};

export const checkTransactionStatus = async (transactionId: string) => {
  try {
    const { data: transaction, error } = await supabase
      .from('pix_transactions')
      .select('mercado_pago_id, status')
      .eq('id', transactionId)
      .single();
    
    if (error) throw error;
    
    if (transaction.mercado_pago_id) {
      const mpStatus = await getPaymentStatus(transaction.mercado_pago_id);
      
      // Atualizar status se mudou
      if (mpStatus.status !== transaction.status) {
        await supabase
          .from('pix_transactions')
          .update({ 
            status: mpStatus.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', transactionId);
      }
      
      return mpStatus;
    }
    
    return { status: transaction.status, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    throw error;
  }
};
```

## 5. Fase 4: Componentes React

### 5.1 Hook para Pagamento PIX

```typescript
// src/hooks/usePixPayment.ts
import { useState } from 'react';
import { createPixTransaction } from '@/services/pixService';
import { CreatePixPaymentData, PixPaymentResponse } from '@/types/pix';
import { toast } from 'sonner';

export const usePixPayment = () => {
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<PixPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createPayment = async (data: CreatePixPaymentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createPixTransaction(data);
      setTransaction(result);
      toast.success('Pagamento PIX criado com sucesso!');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar pagamento';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTransaction(null);
    setError(null);
  };

  return {
    createPayment,
    loading,
    transaction,
    error,
    reset
  };
};
```

### 5.2 Hook para Status da Transação

```typescript
// src/hooks/useTransactionStatus.ts
import { useState, useEffect, useCallback } from 'react';
import { checkTransactionStatus } from '@/services/pixService';
import { TransactionStatus } from '@/types/pix';

export const useTransactionStatus = (transactionId: string | null) => {
  const [status, setStatus] = useState<TransactionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!transactionId) return;
    
    setLoading(true);
    try {
      const result = await checkTransactionStatus(transactionId);
      setStatus(result);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    if (!transactionId) return;
    
    // Verificar imediatamente
    checkStatus();
    
    // Verificar a cada 5 segundos se ainda está pendente
    const interval = setInterval(() => {
      if (status?.status === 'pending') {
        checkStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [transactionId, status?.status, checkStatus]);

  return { status, loading, checkStatus };
};
```

### 5.3 Componente Seletor PIX

```typescript
// src/components/pix/PixSelector.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { QrCode, Zap } from 'lucide-react';

interface PixSelectorProps {
  onSelectPix: () => void;
  loading?: boolean;
}

export const PixSelector: React.FC<PixSelectorProps> = ({ onSelectPix, loading = false }) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">Escolha sua forma de pagamento</h3>
        <p className="text-muted-foreground text-sm">Pagamento rápido e seguro</p>
      </div>
      
      <div className="grid gap-3">
        {/* Opção PIX */}
        <Button
          onClick={onSelectPix}
          disabled={loading}
          className="w-full h-16 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white border-0 rounded-xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-center space-x-3">
            <QrCode className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">PIX</div>
              <div className="text-xs opacity-90">Pagamento instantâneo</div>
            </div>
            <Zap className="h-5 w-5 ml-auto" />
          </div>
        </Button>
        
        {/* Opção Mercado Pago (existente) */}
        <Button
          variant="outline"
          className="w-full h-16 border-2 border-border hover:border-primary/50 rounded-xl transition-all duration-300"
          onClick={() => {
            // Manter funcionalidade existente do Mercado Pago
            window.open('https://mpago.li/2ZqAPDs', '_blank');
          }}
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">MP</span>
            </div>
            <div className="text-left">
              <div className="font-semibold">Mercado Pago</div>
              <div className="text-xs text-muted-foreground">Cartão, boleto e mais</div>
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
};
```

### 5.4 Interface de Pagamento PIX

```typescript
// src/components/pix/PixPaymentInterface.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { PixPaymentResponse } from '@/types/pix';
import { useTransactionStatus } from '@/hooks/useTransactionStatus';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PixPaymentInterfaceProps {
  transaction: PixPaymentResponse;
  onBack: () => void;
  onSuccess: () => void;
}

export const PixPaymentInterface: React.FC<PixPaymentInterfaceProps> = ({
  transaction,
  onBack,
  onSuccess
}) => {
  const { status } = useTransactionStatus(transaction.transactionId);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Timer para expiração
  useEffect(() => {
    const updateTimer = () => {
      const expiresAt = new Date(transaction.expiresAt);
      const now = new Date();
      
      if (now >= expiresAt) {
        setTimeLeft('Expirado');
        return;
      }
      
      const distance = formatDistanceToNow(expiresAt, {
        locale: ptBR,
        addSuffix: false
      });
      setTimeLeft(distance);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [transaction.expiresAt]);

  // Verificar se pagamento foi aprovado
  useEffect(() => {
    if (status?.status === 'approved') {
      toast.success('Pagamento aprovado!');
      onSuccess();
    }
  }, [status?.status, onSuccess]);

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(transaction.pixCode);
      toast.success('Código PIX copiado!');
    } catch (error) {
      toast.error('Erro ao copiar código');
    }
  };

  const getStatusIcon = () => {
    switch (status?.status) {
      case 'approved':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (status?.status) {
      case 'approved':
        return 'Pagamento Aprovado!';
      case 'rejected':
        return 'Pagamento Rejeitado';
      case 'expired':
        return 'Pagamento Expirado';
      default:
        return 'Aguardando Pagamento...';
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1 text-center">
          <h2 className="text-xl font-bold">Pagamento PIX</h2>
        </div>
      </div>

      {/* Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            {getStatusIcon()}
            <span className="font-semibold">{getStatusText()}</span>
          </div>
          
          {status?.status === 'pending' && (
            <div className="text-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 inline mr-1" />
              Expira em: {timeLeft}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code */}
      {status?.status === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Escaneie o QR Code</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <img 
                src={transaction.qrCode} 
                alt="QR Code PIX" 
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Abra o app do seu banco e escaneie o código
            </p>
          </CardContent>
        </Card>
      )}

      {/* Código PIX */}
      {status?.status === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Ou copie o código PIX</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg break-all text-sm font-mono">
                {transaction.pixCode}
              </div>
              <Button onClick={copyPixCode} className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copiar Código PIX
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Valor */}
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="text-2xl font-bold text-primary">
            R$ {transaction.amount.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">
            OneDrip - Plano Profissional
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

## 6. Fase 5: Integração com Componentes Existentes

### 6.1 Atualização do PlanCard

```typescript
// Adicionar ao src/plans/components/PlanCard.tsx
import { PixSelector } from '@/components/pix/PixSelector';
import { PixPaymentInterface } from '@/components/pix/PixPaymentInterface';
import { usePixPayment } from '@/hooks/usePixPayment';

// Adicionar estados
const [showPixSelector, setShowPixSelector] = useState(false);
const [showPixPayment, setShowPixPayment] = useState(false);
const { createPayment, transaction, loading } = usePixPayment();

// Função para iniciar pagamento PIX
const handlePixPayment = async () => {
  try {
    const result = await createPayment({
      planType: plano.ciclo,
      isVip: vipSelected,
      userEmail: userEmail || 'user@example.com',
      amount: calculateTotalPrice()
    });
    
    setShowPixSelector(false);
    setShowPixPayment(true);
  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error);
  }
};

// Substituir o botão de ação por:
{!showPixSelector && !showPixPayment && (
  <Button 
    onClick={() => setShowPixSelector(true)}
    className="w-full text-lg py-4 mb-4 btn-premium"
  >
    {PLANS_CONTENT.configuracoes_gerais.botao_texto}
  </Button>
)}

{showPixSelector && (
  <PixSelector 
    onSelectPix={handlePixPayment}
    loading={loading}
  />
)}

{showPixPayment && transaction && (
  <PixPaymentInterface
    transaction={transaction}
    onBack={() => {
      setShowPixPayment(false);
      setShowPixSelector(true);
    }}
    onSuccess={() => {
      // Redirecionar para página de sucesso
      window.location.href = `/plans/success/${transaction.transactionId}`;
    }}
  />
)}
```

## 7. Fase 6: Páginas de Status

### 7.1 Página de Sucesso

```typescript
// src/pages/PixSuccessPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, MessageCircle } from 'lucide-react';
import { PLANS_CONTENT } from '@/plans/data/content';

export const PixSuccessPage = () => {
  const { transactionId } = useParams();
  const whatsappNumber = PLANS_CONTENT.configuracoes.whatsapp_numero;
  
  const sendComprovante = () => {
    const message = `Olá! Acabei de realizar o pagamento do OneDrip via PIX. ID da transação: ${transactionId}. Gostaria de enviar o comprovante.`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          
          <div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">
              Pagamento Aprovado!
            </h1>
            <p className="text-muted-foreground">
              Seu pagamento foi processado com sucesso.
            </p>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">
              Próximo passo:
            </p>
            <p className="text-sm text-muted-foreground">
              Envie seu comprovante via WhatsApp para ativar sua conta.
            </p>
          </div>
          
          <Button 
            onClick={sendComprovante}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Enviar Comprovante
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full"
          >
            Ir para Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
```

## 8. Fase 7: Configuração de Rotas

```typescript
// Adicionar ao App.tsx ou router
import { PixSuccessPage } from '@/pages/PixSuccessPage';

// Adicionar rota
<Route path="/plans/success/:transactionId" element={<PixSuccessPage />} />
```

## 9. Checklist de Implementação

### ✅ Preparação

* [ ] Instalar dependências

* [ ] Configurar variáveis de ambiente

* [ ] Criar tipos TypeScript

* [ ] Configurar Mercado Pago

### ✅ Backend

* [ ] Criar tabelas no Supabase

* [ ] Implementar serviços PIX

* [ ] Configurar webhooks

* [ ] Testar integração MP

### ✅ Frontend

* [ ] Criar hooks customizados

* [ ] Implementar componentes PIX

* [ ] Atualizar PlanCard

* [ ] Criar páginas de status

### ✅ Testes

* [ ] Testar fluxo completo

* [ ] Validar expiração

* [ ] Testar webhooks

* [ ] Verificar responsividade

### ✅ Deploy

* [ ] Configurar produção

* [ ] Testar em ambiente real

* [ ] Monitorar transações

* [ ] Documentar processo

## 10. Considerações de Segurança

1. **Validação de Webhooks**: Sempre validar assinatura dos webhooks
2. **Rate Limiting**: Implementar limites de requisições
3. **Logs de Auditoria**: Registrar todas as transações
4. **Dados Sensíveis**: Nunca expor tokens no frontend
5. **Timeout**: Configurar timeouts adequados
6. **Retry Logic**: Implementar retry para falhas temporárias

## 11. Monitoramento e Métricas

* Taxa de conversão PIX vs outros métodos

* Tempo médio de pagamento

* Taxa de expiração de transações

* Erros de integração

* Performance dos webhooks

