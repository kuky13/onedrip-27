# Configuração do Mercado Pago - Sistema PIX OneDrip

## 📋 Onde Inserir suas Credenciais do Mercado Pago

Para que os pagamentos PIX funcionem corretamente, você precisa configurar suas credenciais do Mercado Pago no arquivo de variáveis de ambiente.

### 1. Arquivo de Configuração

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
# Credenciais do Mercado Pago
VITE_MERCADO_PAGO_PUBLIC_KEY=SEU_PUBLIC_KEY_AQUI
MERCADO_PAGO_ACCESS_TOKEN=SEU_ACCESS_TOKEN_AQUI

# Configurações PIX
VITE_PIX_EXPIRATION_HOURS=24
VITE_WHATSAPP_COMPROVANTE=64996028022
```

### 2. Como Obter suas Credenciais

1. **Acesse o Mercado Pago Developers**: https://www.mercadopago.com.br/developers
2. **Faça login** com sua conta do Mercado Pago
3. **Crie uma aplicação** ou acesse uma existente
4. **Copie as credenciais**:
   - **Public Key**: Usado no frontend (começa com `APP_USR-`)
   - **Access Token**: Usado no backend (começa com `APP_USR-`)

### 3. Ambiente de Teste vs Produção

#### Para Testes (Sandbox):
```env
VITE_MERCADO_PAGO_PUBLIC_KEY=TEST-1234567890-123456-abcdef123456789-12345678
MERCADO_PAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdef123456789-12345678
```

#### Para Produção:
```env
VITE_MERCADO_PAGO_PUBLIC_KEY=APP_USR-1234567890-123456-abcdef123456789-12345678
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-1234567890-123456-abcdef123456789-12345678
```

### 4. Estrutura do Arquivo .env.local Completo

```env
# ========================================
# CREDENCIAIS DO MERCADO PAGO
# ========================================
# Substitua pelos seus valores reais
VITE_MERCADO_PAGO_PUBLIC_KEY=SEU_PUBLIC_KEY_AQUI
MERCADO_PAGO_ACCESS_TOKEN=SEU_ACCESS_TOKEN_AQUI

# ========================================
# CONFIGURAÇÕES PIX
# ========================================
# Tempo de expiração do PIX em horas
VITE_PIX_EXPIRATION_HOURS=24

# WhatsApp para envio de comprovante (apenas números)
VITE_WHATSAPP_COMPROVANTE=64996028022

# ========================================
# CONFIGURAÇÕES SUPABASE (já existentes)
# ========================================
# Mantenha suas configurações atuais do Supabase
```

### 5. Verificação da Configuração

Após inserir as credenciais:

1. **Reinicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

2. **Acesse a página de planos**: http://localhost:8081/plans

3. **Teste o fluxo PIX**:
   - Selecione um plano
   - Escolha a opção PIX
   - Verifique se o QR Code é gerado

### 6. Solução de Problemas

#### Erro: "Credenciais do Mercado Pago não configuradas"
- ✅ Verifique se o arquivo `.env.local` existe na raiz do projeto
- ✅ Confirme se as variáveis estão nomeadas corretamente
- ✅ Reinicie o servidor após alterar as variáveis

#### Erro: "Invalid credentials"
- ✅ Verifique se as credenciais estão corretas
- ✅ Confirme se está usando credenciais de teste para desenvolvimento
- ✅ Verifique se a aplicação no Mercado Pago está ativa

#### QR Code não aparece
- ✅ Abra o console do navegador para ver erros
- ✅ Verifique se o usuário está logado
- ✅ Confirme se o Supabase está configurado corretamente

### 7. Segurança

⚠️ **IMPORTANTE**:
- Nunca commite o arquivo `.env.local` no Git
- Use credenciais de teste durante o desenvolvimento
- Mantenha suas credenciais de produção seguras
- O arquivo `.env.local` já está no `.gitignore`

### 8. Próximos Passos

Após configurar as credenciais:

1. **Teste o fluxo completo** de pagamento PIX
2. **Configure webhooks** para notificações em tempo real (opcional)
3. **Monitore transações** através do painel do Mercado Pago
4. **Implemente em produção** com credenciais reais

---

## 🎯 Funcionalidades Implementadas

✅ **Seleção de Planos**: Mantidos todos os preços e opções atuais
✅ **Interface PIX**: QR Code e código PIX gerados automaticamente
✅ **Monitoramento**: Status da transação em tempo real
✅ **Páginas de Status**: Confirmação e acompanhamento de pagamento
✅ **Banco de Dados**: Tabelas PIX configuradas no Supabase
✅ **Segurança**: RLS e auditoria implementados

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console do navegador
2. Confirme as configurações do Mercado Pago
3. Teste com credenciais de sandbox primeiro
4. Verifique a conectividade com o Supabase

**Sistema PIX OneDrip implementado com sucesso! 🚀**