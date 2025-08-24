# Configuração do Sistema PIX com Supabase Edge Functions

## 1. Deploy das Edge Functions

Para fazer o deploy das Edge Functions criadas, execute os seguintes comandos:

```bash
# Fazer login no Supabase CLI
supabase login

# Fazer deploy de todas as Edge Functions
supabase functions deploy pix-payment
supabase functions deploy pix-status
supabase functions deploy pix-webhook
```

## 2. Configurar Variáveis de Ambiente no Supabase

No painel do Supabase (https://supabase.com/dashboard), vá em:
**Settings > Edge Functions > Environment Variables**

Adicione as seguintes variáveis:

```
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-5318421292762248-082413-b52fc192c877be236ee07147c5a7eb37-1376810125
MERCADO_PAGO_WEBHOOK_SECRET=367d90acf1873e9d1db65740f9670a8248e30ffaa30a3d7e512ac9d322bd57d8
MERCADO_PAGO_WEBHOOK_URL=https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-webhook
```

## 3. Executar Migrações do Banco de Dados

```bash
# Aplicar as migrações para criar/atualizar a tabela pix_transactions
supabase db push
```

## 4. Configurar Webhook no Mercado Pago

### Opção A: Via Dashboard do Mercado Pago
1. Acesse: https://www.mercadopago.com.br/developers/panel/webhooks
2. Clique em "Criar webhook"
3. Configure:
   - **URL**: `https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-webhook`
   - **Eventos**: Selecione "Pagamentos"
   - **Versão da API**: v1

### Opção B: Via API do Mercado Pago

```bash
curl -X POST \
  'https://api.mercadopago.com/v1/webhooks' \
  -H 'Authorization: Bearer APP_USR-5318421292762248-082413-b52fc192c877be236ee07147c5a7eb37-1376810125' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-webhook",
    "events": [
      {
        "resource": "payments",
        "topic": "payment"
      }
    ]
  }'
```

## 5. URLs das Edge Functions

Após o deploy, as seguintes URLs estarão disponíveis:

- **Criar Pagamento PIX**: `https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-payment`
- **Verificar Status**: `https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-status`
- **Webhook**: `https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-webhook`

## 6. Testar o Sistema

### Teste de Criação de Pagamento
```bash
curl -X POST \
  'https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-payment' \
  -H 'Content-Type: application/json' \
  -d '{
    "planType": "monthly",
    "isVip": false,
    "userEmail": "teste@exemplo.com"
  }'
```

### Teste de Verificação de Status
```bash
curl 'https://oghjlypdnmqecaavekyr.supabase.co/functions/v1/pix-status?external_reference=onedrip-1234567890-monthly-normal'
```

## 7. Monitoramento

Para monitorar os logs das Edge Functions:

```bash
# Ver logs em tempo real
supabase functions logs pix-payment --follow
supabase functions logs pix-status --follow
supabase functions logs pix-webhook --follow
```

## 8. Segurança

- As Edge Functions incluem validação de CORS
- O webhook valida a assinatura do Mercado Pago
- Row Level Security (RLS) está habilitado na tabela `pix_transactions`
- Todas as variáveis sensíveis estão em variáveis de ambiente

## 9. Troubleshooting

### Erro de CORS
Se houver problemas de CORS, verifique se o frontend está fazendo requisições para a URL correta das Edge Functions.

### Webhook não funciona
1. Verifique se a URL do webhook está correta no Mercado Pago
2. Verifique os logs da Edge Function `pix-webhook`
3. Confirme se o `MERCADO_PAGO_WEBHOOK_SECRET` está configurado corretamente

### Pagamentos não são criados
1. Verifique se o `MERCADO_PAGO_ACCESS_TOKEN` está correto
2. Confirme se as migrações do banco foram aplicadas
3. Verifique os logs da Edge Function `pix-payment`