-- Adicionar campos necessários para as Edge Functions
ALTER TABLE pix_transactions 
ADD COLUMN IF NOT EXISTS external_reference TEXT,
ADD COLUMN IF NOT EXISTS preference_id TEXT,
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS mp_status TEXT,
ADD COLUMN IF NOT EXISTS mp_status_detail TEXT,
ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMP WITH TIME ZONE;

-- Atualizar o check constraint para incluir novos status
ALTER TABLE pix_transactions DROP CONSTRAINT IF EXISTS pix_transactions_status_check;
ALTER TABLE pix_transactions ADD CONSTRAINT pix_transactions_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled', 'completed', 'failed', 'refunded', 'unknown'));

-- Atualizar o check constraint para plan_type para incluir 'annual'
ALTER TABLE pix_transactions DROP CONSTRAINT IF EXISTS pix_transactions_plan_type_check;
ALTER TABLE pix_transactions ADD CONSTRAINT pix_transactions_plan_type_check 
    CHECK (plan_type IN ('monthly', 'yearly', 'annual'));

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_pix_transactions_external_reference ON pix_transactions(external_reference);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_preference_id ON pix_transactions(preference_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_payment_id ON pix_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_user_email ON pix_transactions(user_email);

-- Política RLS para permitir que as Edge Functions acessem as transações por email
CREATE POLICY "Edge functions can access transactions by email" ON pix_transactions
    FOR ALL USING (true);

-- Comentários para os novos campos
COMMENT ON COLUMN pix_transactions.external_reference IS 'Referência externa única gerada para a transação';
COMMENT ON COLUMN pix_transactions.preference_id IS 'ID da preferência criada no Mercado Pago';
COMMENT ON COLUMN pix_transactions.payment_id IS 'ID do pagamento no Mercado Pago';
COMMENT ON COLUMN pix_transactions.user_email IS 'Email do usuário que fez a transação';
COMMENT ON COLUMN pix_transactions.mp_status IS 'Status original retornado pelo Mercado Pago';
COMMENT ON COLUMN pix_transactions.mp_status_detail IS 'Detalhes do status retornado pelo Mercado Pago';
COMMENT ON COLUMN pix_transactions.webhook_received_at IS 'Timestamp de quando o webhook foi recebido';