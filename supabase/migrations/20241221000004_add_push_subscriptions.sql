-- Criar tabela para armazenar subscriptions de push notifications
CREATE TABLE IF NOT EXISTS user_push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint para evitar duplicatas
  UNIQUE(user_id, endpoint)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_user_id ON user_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_active ON user_push_subscriptions(is_active) WHERE is_active = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_push_subscriptions_updated_at
  BEFORE UPDATE ON user_push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_push_subscriptions_updated_at();

-- RLS (Row Level Security)
ALTER TABLE user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados só verem suas próprias subscriptions
CREATE POLICY "Users can view own push subscriptions" ON user_push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions" ON user_push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions" ON user_push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions" ON user_push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Função para enviar notificação push (simulada - em produção seria integrada com serviço real)
CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_data JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record RECORD;
  notification_data JSONB;
BEGIN
  -- Preparar dados da notificação
  notification_data := jsonb_build_object(
    'title', p_title,
    'message', p_message,
    'type', p_type,
    'timestamp', extract(epoch from now()),
    'data', p_data
  );
  
  -- Buscar todas as subscriptions ativas do usuário
  FOR subscription_record IN 
    SELECT endpoint, p256dh_key, auth_key 
    FROM user_push_subscriptions 
    WHERE user_id = p_user_id AND is_active = true
  LOOP
    -- Em produção, aqui seria feita a chamada para o serviço de push notifications
    -- Por enquanto, apenas logamos a tentativa
    RAISE NOTICE 'Enviando push notification para endpoint: % com dados: %', 
      subscription_record.endpoint, notification_data;
  END LOOP;
  
  -- Criar registro da notificação na tabela de notificações
  INSERT INTO notifications (
    title,
    message,
    type,
    target_type,
    target_user_id,
    created_by,
    is_active
  ) VALUES (
    p_title,
    p_message,
    p_type,
    'specific',
    p_user_id,
    p_user_id, -- Assumindo que é uma notificação do sistema
    true
  );
  
  RETURN true;
END;
$$;

-- Função para limpar subscriptions inativas antigas
CREATE OR REPLACE FUNCTION cleanup_inactive_push_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deletar subscriptions inativas há mais de 30 dias
  DELETE FROM user_push_subscriptions 
  WHERE is_active = false 
    AND updated_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Conceder permissões
GRANT ALL ON user_push_subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION send_push_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_inactive_push_subscriptions() TO authenticated;

-- Comentários para documentação
COMMENT ON TABLE user_push_subscriptions IS 'Armazena as subscriptions de push notifications dos usuários';
COMMENT ON COLUMN user_push_subscriptions.endpoint IS 'URL do endpoint para envio de push notifications';
COMMENT ON COLUMN user_push_subscriptions.p256dh_key IS 'Chave pública P256DH para criptografia';
COMMENT ON COLUMN user_push_subscriptions.auth_key IS 'Chave de autenticação para push notifications';
COMMENT ON COLUMN user_push_subscriptions.user_agent IS 'User agent do navegador para identificação';
COMMENT ON COLUMN user_push_subscriptions.is_active IS 'Indica se a subscription está ativa';

COMMENT ON FUNCTION send_push_notification(UUID, TEXT, TEXT, TEXT, JSONB) IS 'Envia notificação push para um usuário específico';
COMMENT ON FUNCTION cleanup_inactive_push_subscriptions() IS 'Remove subscriptions inativas antigas para limpeza do banco';