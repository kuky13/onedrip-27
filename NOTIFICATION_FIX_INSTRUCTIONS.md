# Correção do Erro de Ambiguidade na Função delete_user_notification

## Problema Identificado

O erro "Não foi possível escolher a melhor função candidata entre: public.delete_user_notification(p_notification_id => text), public.delete_user_notification(p_notification_id => uuid)" ocorre porque existem duas versões da função `delete_user_notification` no banco de dados Supabase:

1. Uma que aceita parâmetro `TEXT`
2. Outra que aceita parâmetro `UUID`

Isso cria ambiguidade quando o Supabase tenta determinar qual função executar.

## Solução Implementada

### 1. Correções no Frontend

✅ **Arquivo atualizado**: `src/hooks/useNotifications.ts`
- Adicionada validação de UUID antes de chamar a função
- Implementado tratamento de erro mais robusto
- Aplicado tanto para exclusão individual quanto para exclusão em lote

### 2. Migração SQL Criada

✅ **Arquivo criado**: `supabase/migrations/20250121000001_fix_delete_notification_ambiguity.sql`
- Remove a função que aceita `TEXT`
- Mantém apenas a versão que aceita `UUID`
- Inclui validações e verificações de integridade

### 3. Script SQL Manual

✅ **Arquivo criado**: `fix_notification_function.sql`
- Script completo para executar manualmente no Supabase SQL Editor
- Inclui todas as verificações necessárias
- Pode ser usado como alternativa à migração

## Como Aplicar a Correção

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# 1. Fazer login no Supabase
npx supabase login

# 2. Linkar o projeto
npx supabase link --project-ref oghjlypdnmqecaavekyr

# 3. Aplicar as migrações
npx supabase db push
```

### Opção 2: Via SQL Editor do Supabase

1. Acesse o painel do Supabase
2. Vá para **SQL Editor**
3. Copie e cole o conteúdo do arquivo `fix_notification_function.sql`
4. Execute o script
5. Verifique se a mensagem de sucesso aparece

## Verificação da Correção

Após aplicar a correção, você pode verificar se funcionou:

### No Supabase SQL Editor:
```sql
-- Verificar se apenas a versão UUID existe
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'delete_user_notification';
```

### No Frontend:
1. Acesse a página de notificações
2. Tente excluir uma notificação
3. Verifique se não há mais erros de ambiguidade

## Arquivos Modificados

- ✅ `src/hooks/useNotifications.ts` - Validação de UUID no frontend
- ✅ `supabase/migrations/20250121000001_fix_delete_notification_ambiguity.sql` - Migração para resolver ambiguidade
- ✅ `fix_notification_function.sql` - Script manual para aplicar via SQL Editor

## Logs de Debug

O código agora inclui logs detalhados para facilitar o debug:
- `🗑️ DEBUG: Iniciando soft delete` - Início da operação
- `🗑️ DEBUG: Resultado da RPC` - Resultado da chamada
- `🗑️ DEBUG: Erro na RPC` - Erros específicos
- `🗑️ DEBUG: ID não é UUID válido` - Avisos sobre IDs inválidos

## Próximos Passos

1. **Aplicar a correção** usando uma das opções acima
2. **Testar a funcionalidade** de exclusão de notificações
3. **Monitorar os logs** para garantir que não há mais erros
4. **Remover logs de debug** após confirmar que tudo funciona

## Prevenção de Problemas Futuros

- Sempre usar tipos consistentes nas funções do banco
- Documentar mudanças de schema adequadamente
- Testar migrações em ambiente de desenvolvimento primeiro
- Manter apenas uma versão de cada função para evitar ambiguidade