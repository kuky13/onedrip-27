-- Criar tabela de transações PIX
CREATE TABLE IF NOT EXISTS pix_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mercado_pago_id TEXT,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
    is_vip BOOLEAN NOT NULL DEFAULT false,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
    qr_code TEXT,
    pix_code TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Criar tabela de logs de transações
CREATE TABLE IF NOT EXISTS transaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES pix_transactions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    status_from TEXT,
    status_to TEXT,
    webhook_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pix_transactions_user_id ON pix_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_status ON pix_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_created_at ON pix_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_expires_at ON pix_transactions(expires_at);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_mercado_pago_id ON pix_transactions(mercado_pago_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_transaction_id ON transaction_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_created_at ON transaction_logs(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pix_transactions
CREATE POLICY "Users can view their own transactions" ON pix_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON pix_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON pix_transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para transaction_logs
CREATE POLICY "Users can view logs of their transactions" ON transaction_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pix_transactions 
            WHERE pix_transactions.id = transaction_logs.transaction_id 
            AND pix_transactions.user_id = auth.uid()
        )
    );

CREATE POLICY "Service can insert transaction logs" ON transaction_logs
    FOR INSERT WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pix_transactions_updated_at
    BEFORE UPDATE ON pix_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE pix_transactions IS 'Tabela para armazenar transações PIX do sistema OneDrip';
COMMENT ON TABLE transaction_logs IS 'Tabela para logs de eventos das transações PIX';
COMMENT ON COLUMN pix_transactions.mercado_pago_id IS 'ID da transação no Mercado Pago';
COMMENT ON COLUMN pix_transactions.plan_type IS 'Tipo do plano: monthly ou yearly';
COMMENT ON COLUMN pix_transactions.is_vip IS 'Se inclui upgrade VIP';
COMMENT ON COLUMN pix_transactions.amount IS 'Valor total da transação em reais';
COMMENT ON COLUMN pix_transactions.status IS 'Status da transação: pending, approved, rejected, expired, cancelled';
COMMENT ON COLUMN pix_transactions.qr_code IS 'Código QR para pagamento PIX';
COMMENT ON COLUMN pix_transactions.pix_code IS 'Código PIX alfanumérico';
COMMENT ON COLUMN pix_transactions.expires_at IS 'Data e hora de expiração do pagamento';
COMMENT ON COLUMN pix_transactions.metadata IS 'Dados adicionais em formato JSON';