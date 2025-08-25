# 📋 Plano Detalhado de Refatoração: Sistema de Vendas via WhatsApp

## 1. Visão Geral do Projeto

### 1.1 Objetivo
Refatorar o sistema OneDrip removendo completamente a integração PIX/Mercado Pago e implementando um sistema de vendas simplificado via WhatsApp, reduzindo complexidade e custos operacionais.

### 1.2 Justificativa
- **Redução de Custos**: Eliminação das taxas do Mercado Pago (3,99% + R$ 0,40 por transação)
- **Simplificação**: Remoção de 53 arquivos relacionados ao PIX e 3 Edge Functions
- **Controle Total**: Gestão direta do processo de vendas via WhatsApp
- **Melhor Conversão**: Atendimento personalizado e direto com clientes

## 2. Análise Completa do Sistema Atual

### 2.1 Componentes PIX/Mercado Pago Identificados

#### 2.1.1 Frontend (React)
```
📁 Páginas de Pagamento:
├── src/pages/PaymentSuccess.tsx
├── src/pages/PaymentFailure.tsx
└── src/pages/PaymentStatus.tsx

📁 Componentes PIX:
├── src/components/PixPaymentModal.tsx
├── src/components/pix/QRCodeDisplay.tsx
└── src/components/PixPaymentInterface.tsx

📁 Serviços:
├── src/services/paymentService.ts
├── src/services/mercadoPagoService.ts
└── src/services/pixPaymentOptimized.ts

📁 Hooks:
├── src/hooks/usePixPayment.ts
└── src/hooks/useTransactionStatus.ts

📁 Tipos:
└── shared/types/pix.ts (228 linhas)
```

#### 2.1.2 Backend (Supabase)
```
📁 Edge Functions:
├── supabase/functions/pix-payment/index.ts
├── supabase/functions/pix-status/index.ts
└── supabase/functions/pix-webhook/index.ts

📁 Migrações SQL:
├── supabase/migrations/create_pix_transactions.sql
├── supabase/migrations/20250125000001_update_pix_transactions_for_edge_functions.sql
└── supabase/migrations/grant_pix_permissions.sql

📁 Tabelas:
└── pix_transactions (12 colunas + índices + RLS)
```

#### 2.1.3 Configurações
```
📁 Arquivos de Configuração:
├── MERCADO_PAGO_SETUP.md
├── SUPABASE_SETUP.md
├── test-pix-functions.js
└── storage/pix_transactions.json

📁 Variáveis de Ambiente:
├── MERCADO_PAGO_ACCESS_TOKEN
├── MERCADO_PAGO_WEBHOOK_SECRET
└── MERCADO_PAGO_WEBHOOK_URL
```

### 2.2 Sistema WhatsApp Existente

#### 2.2.1 Utilitários Atuais
```typescript
// src/utils/whatsappUtils.ts
- generateWhatsAppMessage()
- shareViaWhatsApp()
- openWhatsApp()

// src/utils/whatsapp.ts
- formatPhoneNumber()
- createWhatsAppUrl()
- openWhatsApp()
```

#### 2.2.2 Funcionalidades Implementadas
- Geração de mensagens para orçamentos
- Formatação de números de telefone
- Abertura de chats WhatsApp
- Compartilhamento de conteúdo

## 3. Plano de Implementação

### 3.1 Fase 1: Remoção do Sistema PIX/Mercado Pago (Semana 1)

#### 3.1.1 Limpeza do Database
```sql
-- Script de remoção (cleanup_pix_system.sql)
DROP TABLE IF EXISTS pix_transactions CASCADE;
DROP TABLE IF EXISTS transaction_logs CASCADE;

-- Remover políticas RLS relacionadas
DROP POLICY IF EXISTS "Users can view their own transactions" ON pix_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON pix_transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON pix_transactions;
DROP POLICY IF EXISTS "Edge functions can access transactions by email" ON pix_transactions;

-- Limpar payment_conditions se não for usado
DROP TABLE IF EXISTS payment_conditions CASCADE;
```

#### 3.1.2 Remoção de Edge Functions
```bash
# Comandos para remoção
supabase functions delete pix-payment
supabase functions delete pix-status
supabase functions delete pix-webhook
```

#### 3.1.3 Limpeza do Frontend
```bash
# Arquivos a serem removidos
rm src/pages/PaymentSuccess.tsx
rm src/pages/PaymentFailure.tsx
rm src/pages/PaymentStatus.tsx
rm src/components/PixPaymentModal.tsx
rm src/services/paymentService.ts
rm src/services/mercadoPagoService.ts
rm src/services/pixPaymentOptimized.ts
rm shared/types/pix.ts
rm -rf src/components/pix/
```

#### 3.1.4 Atualização de Rotas
```typescript
// src/App.tsx - Remover rotas
// REMOVER:
// import { PaymentSuccess } from "./pages/PaymentSuccess";
// import { PaymentFailure } from "./pages/PaymentFailure";
// import { PaymentStatus } from "./pages/PaymentStatus";
// <Route path="/payment/success" element={<PaymentSuccess />} />
// <Route path="/payment/failure" element={<PaymentFailure />} />
// <Route path="/payment/status/:transactionId" element={<PaymentStatus />} />
```

### 3.2 Fase 2: Implementação do Sistema WhatsApp (Semana 2)

#### 3.2.1 Estrutura de Arquivos Nova
```
📁 Nova Estrutura WhatsApp:
├── src/components/whatsapp/
│   ├── WhatsAppCheckout.tsx
│   ├── WhatsAppPlanCard.tsx
│   ├── WhatsAppContactModal.tsx
│   └── WhatsAppSuccessPage.tsx
├── src/services/whatsappSalesService.ts
├── src/hooks/useWhatsAppSales.ts
├── src/types/whatsappSales.ts
└── src/utils/whatsappTemplates.ts
```

#### 3.2.2 Tipos TypeScript
```typescript
// src/types/whatsappSales.ts
export interface WhatsAppPlan {
  id: string;
  name: string;
  type: 'monthly' | 'yearly';
  price: number;
  originalPrice?: number;
  features: string[];
  isVip: boolean;
  whatsappMessage: string;
}

export interface WhatsAppSale {
  id: string;
  planId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: 'pending' | 'contacted' | 'negotiating' | 'closed' | 'lost';
  createdAt: Date;
  contactedAt?: Date;
  closedAt?: Date;
  notes?: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
}
```

#### 3.2.3 Serviço de Vendas WhatsApp
```typescript
// src/services/whatsappSalesService.ts
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppPlan, WhatsAppSale } from '@/types/whatsappSales';

export class WhatsAppSalesService {
  // Configurações
  private static readonly WHATSAPP_NUMBER = '556496028022';
  
  // Planos disponíveis
  static getPlans(): WhatsAppPlan[] {
    return [
      {
        id: 'monthly-basic',
        name: 'Plano Mensal',
        type: 'monthly',
        price: 29.90,
        features: ['Acesso completo', 'Suporte via WhatsApp'],
        isVip: false,
        whatsappMessage: this.generatePlanMessage('monthly', false)
      },
      {
        id: 'yearly-basic',
        name: 'Plano Anual',
        type: 'yearly',
        price: 299.90,
        originalPrice: 358.80,
        features: ['Acesso completo', '2 meses grátis', 'Suporte prioritário'],
        isVip: false,
        whatsappMessage: this.generatePlanMessage('yearly', false)
      }
    ];
  }
  
  // Gerar mensagem personalizada
  static generatePlanMessage(planType: 'monthly' | 'yearly', isVip: boolean): string {
    const plan = this.getPlans().find(p => p.type === planType && p.isVip === isVip);
    if (!plan) return '';
    
    return `🚀 *Olá! Tenho interesse no ${plan.name}*\n\n` +
           `💰 *Valor:* R$ ${plan.price.toFixed(2).replace('.', ',')}\n` +
           `📋 *Recursos inclusos:*\n${plan.features.map(f => `• ${f}`).join('\n')}\n\n` +
           `📱 *Gostaria de mais informações sobre:*\n` +
           `• Formas de pagamento\n` +
           `• Processo de ativação\n` +
           `• Suporte técnico\n\n` +
           `⏰ *Aguardo seu contato!*`;
  }
  
  // Abrir WhatsApp com mensagem
  static openWhatsAppWithPlan(planId: string): void {
    const plan = this.getPlans().find(p => p.id === planId);
    if (!plan) return;
    
    const url = `https://wa.me/${this.WHATSAPP_NUMBER}?text=${encodeURIComponent(plan.whatsappMessage)}`;
    window.open(url, '_blank');
    
    // Registrar evento de conversão
    this.trackConversion(planId);
  }
  
  // Tracking de conversões
  static async trackConversion(planId: string): Promise<void> {
    try {
      await supabase.from('whatsapp_conversions').insert({
        plan_id: planId,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer
      });
    } catch (error) {
      console.error('Erro ao registrar conversão:', error);
    }
  }
}
```

#### 3.2.4 Componente de Checkout WhatsApp
```typescript
// src/components/whatsapp/WhatsAppCheckout.tsx
import React from 'react';
import { MessageCircle, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WhatsAppSalesService } from '@/services/whatsappSalesService';
import { WhatsAppPlan } from '@/types/whatsappSales';

interface WhatsAppCheckoutProps {
  plan: WhatsAppPlan;
  onContactClick: () => void;
}

export const WhatsAppCheckout: React.FC<WhatsAppCheckoutProps> = ({ plan, onContactClick }) => {
  const handleWhatsAppClick = () => {
    WhatsAppSalesService.openWhatsAppWithPlan(plan.id);
    onContactClick();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          {plan.isVip && <Star className="w-5 h-5 text-yellow-500" />}
          {plan.name}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preço */}
        <div className="text-center">
          {plan.originalPrice && (
            <p className="text-sm text-gray-500 line-through">
              De R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
            </p>
          )}
          <p className="text-3xl font-bold text-green-600">
            R$ {plan.price.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-sm text-gray-600">
            {plan.type === 'monthly' ? 'por mês' : 'por ano'}
          </p>
        </div>
        
        {/* Features */}
        <div className="space-y-2">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
        
        {/* Botão WhatsApp */}
        <Button 
          onClick={handleWhatsAppClick}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Comprar via WhatsApp
        </Button>
        
        {/* Informações adicionais */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>✅ Ativação imediata após confirmação</p>
          <p>💳 Aceitamos PIX, cartão e boleto</p>
          <p>🔒 Compra 100% segura</p>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 3.3 Fase 3: Atualização da Página de Planos (Semana 2)

#### 3.3.1 Nova PlansPage.tsx
```typescript
// src/pages/PlansPage.tsx - Versão refatorada
import React, { useState } from 'react';
import { WhatsAppCheckout } from '@/components/whatsapp/WhatsAppCheckout';
import { WhatsAppSalesService } from '@/services/whatsappSalesService';
import { toast } from 'sonner';

export const PlansPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const plans = WhatsAppSalesService.getPlans();

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContactClick = () => {
    toast.success('Redirecionando para WhatsApp...');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Escolha seu Plano</h1>
        <p className="text-gray-600">Atendimento personalizado via WhatsApp</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <WhatsAppCheckout
            key={plan.id}
            plan={plan}
            onContactClick={handleContactClick}
          />
        ))}
      </div>
      
      {/* Seção de benefícios */}
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-6">Por que escolher nosso atendimento via WhatsApp?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4">
            <h3 className="font-semibold mb-2">🚀 Ativação Rápida</h3>
            <p className="text-sm text-gray-600">Confirmação e ativação em minutos</p>
          </div>
          <div className="p-4">
            <h3 className="font-semibold mb-2">💬 Suporte Direto</h3>
            <p className="text-sm text-gray-600">Tire dúvidas diretamente conosco</p>
          </div>
          <div className="p-4">
            <h3 className="font-semibold mb-2">💳 Flexibilidade</h3>
            <p className="text-sm text-gray-600">Várias formas de pagamento</p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 3.4 Fase 4: Sistema de Tracking e Analytics (Semana 3)

#### 3.4.1 Tabela de Conversões
```sql
-- supabase/migrations/create_whatsapp_system.sql
CREATE TABLE IF NOT EXISTS whatsapp_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  referrer TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'negotiating', 'closed', 'lost')),
  amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX idx_whatsapp_conversions_plan_id ON whatsapp_conversions(plan_id);
CREATE INDEX idx_whatsapp_conversions_timestamp ON whatsapp_conversions(timestamp DESC);
CREATE INDEX idx_whatsapp_sales_status ON whatsapp_sales(status);
CREATE INDEX idx_whatsapp_sales_created_at ON whatsapp_sales(created_at DESC);

-- RLS Policies
ALTER TABLE whatsapp_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous conversions" ON whatsapp_conversions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admins can view all sales" ON whatsapp_sales
  FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
```

#### 3.4.2 Dashboard de Analytics
```typescript
// src/components/admin/WhatsAppAnalytics.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsData {
  totalConversions: number;
  conversionsByPlan: Record<string, number>;
  conversionRate: number;
  totalSales: number;
}

export const WhatsAppAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Buscar conversões
      const { data: conversions } = await supabase
        .from('whatsapp_conversions')
        .select('plan_id');

      // Buscar vendas
      const { data: sales } = await supabase
        .from('whatsapp_sales')
        .select('status, amount');

      if (conversions && sales) {
        const conversionsByPlan = conversions.reduce((acc, conv) => {
          acc[conv.plan_id] = (acc[conv.plan_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const closedSales = sales.filter(s => s.status === 'closed');
        const conversionRate = conversions.length > 0 
          ? (closedSales.length / conversions.length) * 100 
          : 0;

        setAnalytics({
          totalConversions: conversions.length,
          conversionsByPlan,
          conversionRate,
          totalSales: closedSales.length
        });
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando analytics...</div>;
  if (!analytics) return <div>Erro ao carregar dados</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total de Cliques</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{analytics.totalConversions}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Vendas Fechadas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{analytics.totalSales}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Plano Mais Popular</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">
            {Object.entries(analytics.conversionsByPlan)
              .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
```

## 4. Cronograma de Implementação

### Semana 1: Remoção do Sistema PIX
- **Dia 1-2**: Backup completo do sistema atual
- **Dia 3-4**: Remoção de Edge Functions e limpeza do database
- **Dia 5**: Remoção de componentes frontend e atualização de rotas

### Semana 2: Implementação WhatsApp
- **Dia 1-2**: Criação dos novos tipos e serviços WhatsApp
- **Dia 3-4**: Desenvolvimento dos componentes de checkout
- **Dia 5**: Refatoração da página de planos

### Semana 3: Analytics e Otimização
- **Dia 1-2**: Implementação do sistema de tracking
- **Dia 3-4**: Criação do dashboard de analytics
- **Dia 5**: Testes e ajustes finais

### Semana 4: Testes e Deploy
- **Dia 1-3**: Testes completos em ambiente de desenvolvimento
- **Dia 4**: Deploy em produção
- **Dia 5**: Monitoramento e ajustes pós-deploy

## 5. Lista Completa de Arquivos

### 5.1 Arquivos a Serem Removidos
```
❌ REMOVER:
├── src/pages/PaymentSuccess.tsx
├── src/pages/PaymentFailure.tsx
├── src/pages/PaymentStatus.tsx
├── src/components/PixPaymentModal.tsx
├── src/components/pix/ (pasta completa)
├── src/services/paymentService.ts
├── src/services/mercadoPagoService.ts
├── src/services/pixPaymentOptimized.ts
├── src/hooks/usePixPayment.ts
├── src/hooks/useTransactionStatus.ts
├── shared/types/pix.ts
├── supabase/functions/pix-payment/
├── supabase/functions/pix-status/
├── supabase/functions/pix-webhook/
├── supabase/migrations/create_pix_transactions.sql
├── supabase/migrations/20250125000001_update_pix_transactions_for_edge_functions.sql
├── supabase/migrations/grant_pix_permissions.sql
├── MERCADO_PAGO_SETUP.md
├── test-pix-functions.js
└── storage/pix_transactions.json
```

### 5.2 Arquivos a Serem Criados
```
✅ CRIAR:
├── src/components/whatsapp/
│   ├── WhatsAppCheckout.tsx
│   ├── WhatsAppPlanCard.tsx
│   ├── WhatsAppContactModal.tsx
│   └── WhatsAppSuccessPage.tsx
├── src/services/whatsappSalesService.ts
├── src/hooks/useWhatsAppSales.ts
├── src/types/whatsappSales.ts
├── src/utils/whatsappTemplates.ts
├── src/components/admin/WhatsAppAnalytics.tsx
├── supabase/migrations/create_whatsapp_system.sql
└── docs/WHATSAPP_SALES_GUIDE.md
```

### 5.3 Arquivos a Serem Modificados
```
🔄 MODIFICAR:
├── src/App.tsx (remover rotas de pagamento)
├── src/pages/PlansPage.tsx (nova lógica WhatsApp)
├── src/utils/whatsappUtils.ts (expandir funcionalidades)
├── src/components/AdminPanel.tsx (adicionar analytics)
├── package.json (remover dependências PIX)
├── supabase/config.toml (limpar edge functions)
└── README.md (atualizar documentação)
```

## 6. Testes e Validação

### 6.1 Testes Funcionais
```typescript
// tests/whatsapp-sales.test.ts
import { WhatsAppSalesService } from '@/services/whatsappSalesService';

describe('WhatsApp Sales Service', () => {
  test('deve gerar mensagem correta para plano mensal', () => {
    const message = WhatsAppSalesService.generatePlanMessage('monthly', false);
    expect(message).toContain('Plano Mensal');
    expect(message).toContain('R$ 29,90');
  });
  
  test('deve abrir WhatsApp com URL correta', () => {
    const spy = jest.spyOn(window, 'open').mockImplementation();
    WhatsAppSalesService.openWhatsAppWithPlan('monthly-basic');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('wa.me/556496028022'),
      '_blank'
    );
  });
});
```

### 6.2 Checklist de Validação
- [ ] Todas as rotas PIX foram removidas
- [ ] Componentes WhatsApp funcionam corretamente
- [ ] Mensagens são geradas adequadamente
- [ ] Tracking de conversões está funcionando
- [ ] Analytics exibem dados corretos
- [ ] Não há referências ao sistema PIX no código
- [ ] Performance da aplicação mantida
- [ ] Responsividade em dispositivos móveis

## 7. Benefícios Esperados

### 7.1 Técnicos
- **Redução de Complexidade**: -53 arquivos relacionados ao PIX
- **Menor Superfície de Ataque**: Eliminação de webhooks e APIs externas
- **Facilidade de Manutenção**: Sistema mais simples e direto
- **Performance**: Menos dependências e chamadas de API

### 7.2 Comerciais
- **Redução de Custos**: Eliminação das taxas do Mercado Pago
- **Maior Controle**: Gestão direta do processo de vendas
- **Melhor Conversão**: Atendimento personalizado via WhatsApp
- **Flexibilidade**: Negociação direta com clientes

### 7.3 Operacionais
- **Atendimento Direto**: Comunicação imediata com clientes
- **Processo Simplificado**: Menos etapas para fechamento de vendas
- **Tracking Melhorado**: Analytics específicos para WhatsApp
- **Escalabilidade**: Sistema mais fácil de escalar e modificar

## 8. Considerações de Segurança

### 8.1 Dados Sensíveis
- Remover todas as chaves do Mercado Pago das variáveis de ambiente
- Limpar logs que possam conter informações de pagamento
- Verificar se não há dados PIX em cache ou localStorage

### 8.2 Compliance
- Atualizar política de privacidade removendo referências ao Mercado Pago
- Verificar conformidade com LGPD para dados coletados via WhatsApp
- Documentar novo fluxo de dados para auditoria

## 9. Monitoramento Pós-Deploy

### 9.1 Métricas a Acompanhar
- Taxa de cliques nos botões WhatsApp
- Tempo de resposta no atendimento
- Taxa de conversão WhatsApp → Venda
- Satisfação do cliente
- Tempo médio de fechamento de vendas

### 9.2 Alertas e Logs
```typescript
// Configurar alertas para:
- Erros na geração de mensagens WhatsApp
- Falhas no tracking de conversões
- Problemas de performance na página de planos
- Anomalias nas métricas de conversão
```

---

**Documento criado em:** $(date)
**Versão:** 1.0
**Responsável:** Equipe de Desenvolvimento OneDrip
**Próxima revisão:** Após implementação completa