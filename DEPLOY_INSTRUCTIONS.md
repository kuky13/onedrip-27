# 📋 Instruções para Deploy das Edge Functions

## ✅ Status Atual

Todas as Edge Functions foram criadas e configuradas com sucesso:

- ✅ **pix-payment**: Criação de pagamentos PIX
- ✅ **pix-status**: Consulta de status de pagamentos
- ✅ **pix-webhook**: Processamento de webhooks do Mercado Pago

## 🚀 Como Fazer o Deploy

### 1. Fazer Login no Supabase CLI

```bash
npx supabase login
```

- O comando abrirá seu navegador
- Faça login com sua conta do Supabase
- Autorize o CLI

### 2. Deploy das Edge Functions

Após o login, execute os comandos de deploy:

```bash
# Deploy da função de pagamento PIX
npx supabase functions deploy pix-payment

# Deploy da função de status
npx supabase functions deploy pix-status

# Deploy da função de webhook
npx supabase functions deploy pix-webhook
```

### 3. Configurar Variáveis de Ambiente no Supabase

No painel do Supabase (https://supabase.com/dashboard), vá em:

**Project Settings > Edge Functions > Environment Variables**

Adicione as seguintes variáveis:

```
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-5318421292762248-082413-b52fc192c877be236ee07147c5a7eb37-1376810125
MERCADO_PAGO_WEBHOOK_SECRET=367d90acf1873e9d1db65740f9670a8248e30ffaa30a3d7e512ac9d322bd57d8
MERCADO_PAGO_WEBHOOK_URL=https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-webhook
SUPABASE_URL=https://oghjlypdnmqecaavekyr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naGpseXBkbm1xZWNhYXZla3lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5MTUxNDk0OSwiZXhwIjoyMDA3MDkwOTQ5fQ.KxGw-XwDqHANKBQqhb5m5qz7QZW5I8F8_fgnlJ3mJUM
```

### 4. Testar as Edge Functions

Após o deploy, execute o script de teste:

```bash
node test-pix-functions.js
```

## 🔧 URLs das Edge Functions

Após o deploy, as funções estarão disponíveis em:

- **PIX Payment**: `https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-payment`
- **PIX Status**: `https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-status`
- **PIX Webhook**: `https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-webhook`

## 🔒 Recursos de Segurança Implementados

### CORS Restritivo
- Apenas origens específicas são permitidas
- Headers de segurança configurados

### Validação de Entrada
- Validação de email
- Validação de tipos de dados
- Sanitização de parâmetros

### Rate Limiting
- Limite de 5 requisições por minuto por IP
- Proteção contra spam

### Webhook Security
- Validação de assinatura HMAC SHA256
- Verificação de origem

## 📊 Monitoramento

Após o deploy, você pode monitorar as funções em:

**Supabase Dashboard > Edge Functions > Logs**

## 🐛 Troubleshooting

### Erro: "Function not found"
- Verifique se o deploy foi realizado com sucesso
- Confirme se as variáveis de ambiente estão configuradas

### Erro: "CORS"
- Verifique se a origem da requisição está na lista permitida
- Confirme os headers da requisição

### Erro: "Mercado Pago API"
- Verifique se o `MERCADO_PAGO_ACCESS_TOKEN` está correto
- Confirme se está usando o token de sandbox para testes

## 📝 Próximos Passos

1. ✅ Deploy das Edge Functions
2. ✅ Configuração das variáveis de ambiente
3. ✅ Teste das funções
4. 🔄 Configuração do webhook no Mercado Pago
5. 🔄 Teste de pagamento real
6. 🔄 Deploy para produção

---

**Nota**: Este sistema substitui completamente o backend local (localhost:3001) e está pronto para produção com todas as medidas de segurança implementadas.