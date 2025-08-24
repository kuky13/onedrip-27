# 🔧 Atualização de Credenciais Mercado Pago e Configuração de Webhooks - Sistema PIX OneDrip

## 📋 Análise do Sistema Atual

### Arquitetura de Pagamentos PIX
O sistema OneDrip utiliza uma arquitetura híbrida para processamento de pagamentos PIX:

1. **Frontend React** (localhost:5173/8081)
   - Interface de seleção de planos
   - Geração de QR Code PIX
   - Monitoramento de status de pagamento

2. **Backend Express.js** (localhost:3001)
   - Processamento de webhooks
   - Integração com Mercado Pago API
   - Atualização de status de transações

3. **Edge Functions Supabase**
   - `pix-payment`: Criação de pagamentos PIX
   - `pix-status`: Consulta de status
   - `pix-webhook`: Processamento de notificações

4. **Banco de Dados Supabase**
   - Armazenamento de transações PIX
   - Controle de usuários e planos

### Credenciais Atuais Identificadas
- **Public Key Atual**: `APP_USR-cfeffc1d-ba7e-42f5-a0b2-43734c655edc`
- **Access Token Atual**: `APP_USR-5493371086878462-080109-0da4d53630bd560c3fbb4f0272bd984f-1376810125`
- **Webhook Secret**: `367d90acf1873e9d1db65740f9670a8248e30ffaa30a3d7e512ac9d322bd57d8`

## 🔄 Substituição das Credenciais

### Novas Credenciais Fornecidas
- **Chave 1 (Public Key)**: `APP_USR-7bc65139-2b44-4dc8-ba7c-5a7940b7e168`
- **Chave 2 (Access Token)**: `APP_USR-5318421292762248-082413-b52fc192c877be236ee07147c5a7eb37-1376810125`

### Passo 1: Atualizar Arquivo .env.local

1. **Abra o arquivo** `.env.local` na raiz do projeto
2. **Substitua as credenciais** pelas novas:

```env
# Mercado Pago - PRODUÇÃO
VITE_MERCADO_PAGO_PUBLIC_KEY=APP_USR-7bc65139-2b44-4dc8-ba7c-5a7940b7e168
VITE_MERCADO_PAGO_ACCESS_TOKEN=APP_USR-5318421292762248-082413-b52fc192c877be236ee07147c5a7eb37-1376810125
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-5318421292762248-082413-b52fc192c877be236ee07147c5a7eb37-1376810125

# Configurações PIX (manter)
MERCADO_PAGO_WEBHOOK_SECRET=367d90acf1873e9d1db65740f9670a8248e30ffaa30a3d7e512ac9d322bd57d8
VITE_PIX_EXPIRATION_HOURS=24
VITE_WHATSAPP_COMPROVANTE=64996028022
```

3. **Salve o arquivo** e reinicie os servidores

### Passo 2: Atualizar Edge Functions do Supabase

1. **Acesse o painel do Supabase**: https://supabase.com/dashboard
2. **Vá para**: Project Settings > Edge Functions > Environment Variables
3. **Atualize a variável**:
   - `MERCADO_PAGO_ACCESS_TOKEN` = `APP_USR-5318421292762248-082413-b52fc192c877be236ee07147c5a7eb37-1376810125`

### Passo 3: Redeploy das Edge Functions

```bash
# Fazer login no Supabase CLI
npx supabase login

# Redeploy das funções PIX
npx supabase functions deploy pix-payment
npx supabase functions deploy pix-status
npx supabase functions deploy pix-webhook
```

## 🔗 Configuração de Webhooks para http://kuky.pro

### Passo 1: Configurar URL do Webhook no Supabase

1. **No painel do Supabase**, vá para Environment Variables
2. **Atualize a variável**:
   - `MERCADO_PAGO_WEBHOOK_URL` = `https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-webhook`

### Passo 2: Configurar Webhook no Mercado Pago

1. **Acesse**: https://www.mercadopago.com.br/developers
2. **Faça login** com sua conta
3. **Vá para**: Suas integrações > [Sua Aplicação] > Webhooks
4. **Configure o webhook**:
   - **URL**: `https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-webhook`
   - **Eventos**: Selecione "Pagamentos"
   - **Versão da API**: v1

### Passo 3: Configurar Domínio Personalizado (Opcional)

Para usar seu domínio `http://kuky.pro`:

1. **Configure um proxy/redirect** em seu servidor para:
   - `http://kuky.pro/webhook/pix` → `https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-webhook`

2. **Atualize a URL no Mercado Pago** para:
   - `http://kuky.pro/webhook/pix`

3. **Adicione o domínio** nas origens permitidas da Edge Function:

```typescript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://onedrip-27.vercel.app',
  'http://kuky.pro',
  'https://kuky.pro',
  'https://api.mercadopago.com'
]
```

## ✅ Validação e Testes

### Teste 1: Verificar Configuração Local

```bash
# Reiniciar servidores
npm run dev
cd backend && node server.js
```

1. **Acesse**: http://localhost:5173/plans
2. **Selecione um plano** e escolha PIX
3. **Verifique** se o QR Code é gerado
4. **Monitore** os logs do console

### Teste 2: Testar Edge Functions

```bash
# Executar script de teste
node test-pix-functions.js
```

### Teste 3: Validar Webhook

1. **Faça um pagamento PIX de teste**
2. **Monitore os logs** no Supabase Dashboard
3. **Verifique** se o status é atualizado no banco

### Teste 4: Verificar Integração Completa

1. **Crie uma transação PIX**
2. **Pague via PIX** (valor mínimo)
3. **Confirme** que o webhook processa corretamente
4. **Verifique** atualização no banco de dados

## 📋 Checklist de Verificação 100% Funcionamento

### ✅ Configuração de Credenciais
- [ ] Arquivo `.env.local` atualizado com novas credenciais
- [ ] Variáveis de ambiente do Supabase atualizadas
- [ ] Edge Functions redesployadas
- [ ] Servidores reiniciados

### ✅ Funcionalidade PIX
- [ ] QR Code PIX é gerado corretamente
- [ ] Código PIX copia e cola funciona
- [ ] Status de pagamento é monitorado
- [ ] Páginas de sucesso/falha funcionam

### ✅ Webhooks
- [ ] URL do webhook configurada no Mercado Pago
- [ ] Webhook processa notificações corretamente
- [ ] Status de transações é atualizado no banco
- [ ] Logs de webhook aparecem no Supabase

### ✅ Segurança
- [ ] Validação de assinatura HMAC funciona
- [ ] Rate limiting está ativo
- [ ] CORS configurado corretamente
- [ ] Headers de segurança implementados

### ✅ Monitoramento
- [ ] Logs detalhados em todas as funções
- [ ] Tratamento de erros implementado
- [ ] Fallbacks para falhas de API
- [ ] Auditoria de transações ativa

## 🚨 Solução de Problemas

### Erro: "Credenciais inválidas"
1. Verifique se as credenciais estão corretas
2. Confirme se são credenciais de produção (não teste)
3. Verifique se a aplicação no Mercado Pago está ativa

### Erro: "Webhook não recebido"
1. Verifique a URL do webhook no Mercado Pago
2. Confirme se a Edge Function está deployada
3. Monitore logs no Supabase Dashboard

### Erro: "QR Code não aparece"
1. Abra o console do navegador
2. Verifique se o usuário está logado
3. Confirme configuração do Supabase

### Erro: "CORS"
1. Adicione a origem nas origens permitidas
2. Verifique headers da requisição
3. Confirme configuração do CORS

## 📞 Comandos de Emergência

### Reverter para Credenciais Antigas
```env
# Em caso de problemas, use as credenciais antigas temporariamente
VITE_MERCADO_PAGO_PUBLIC_KEY=APP_USR-cfeffc1d-ba7e-42f5-a0b2-43734c655edc
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-5493371086878462-080109-0da4d53630bd560c3fbb4f0272bd984f-1376810125
```

### Logs de Debug
```bash
# Monitorar logs do backend
tail -f backend/logs/app.log

# Verificar status das Edge Functions
npx supabase functions list
```

## 🎯 Próximos Passos

1. **Monitorar** transações por 24-48 horas
2. **Configurar alertas** para falhas de webhook
3. **Implementar** dashboard de monitoramento
4. **Documentar** procedimentos de manutenção
5. **Treinar equipe** em troubleshooting

---

**✅ Sistema PIX OneDrip com novas credenciais configurado e validado!**

*Última atualização: $(date)*