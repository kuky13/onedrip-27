-- =====================================================
-- SISTEMA DE AUDITORIA E LOGS DE SEGURANÇA
-- Implementa tabelas e funções para rastreamento completo
-- =====================================================

-- Tabela principal de logs de auditoria de segurança
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    resource_type TEXT,
    resource_id TEXT,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_risk_level ON security_audit_log(risk_level);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_timestamp ON security_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_ip_address ON security_audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_session_id ON security_audit_log(session_id);

-- Índice composto para consultas comuns
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_event_time 
    ON security_audit_log(user_id, event_type, timestamp DESC);

-- Tabela de verificações de e-mail
CREATE TABLE IF NOT EXISTS user_email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    method TEXT CHECK (method IN ('email_link', 'otp', 'admin_override')) DEFAULT 'email_link',
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    verification_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para verificações de e-mail
CREATE INDEX IF NOT EXISTS idx_user_email_verifications_user_id ON user_email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_email_verifications_verified_at ON user_email_verifications(verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_email_verifications_token ON user_email_verifications(verification_token);

-- Tabela de tentativas de verificação (rate limiting)
CREATE TABLE IF NOT EXISTS user_verification_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    attempt_type TEXT NOT NULL,
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT FALSE,
    failure_reason TEXT
);

-- Índices para tentativas de verificação
CREATE INDEX IF NOT EXISTS idx_user_verification_attempts_user_id ON user_verification_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verification_attempts_attempted_at ON user_verification_attempts(attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_verification_attempts_type_time 
    ON user_verification_attempts(attempt_type, attempted_at DESC);

-- Tabela de sessões de usuário (para rastreamento)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    location_data JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    logout_reason TEXT
);

-- Índices para sessões
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity DESC);

-- Tabela de IPs suspeitos
CREATE TABLE IF NOT EXISTS suspicious_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    first_detected TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    violation_count INTEGER DEFAULT 1,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id)
);

-- Índices para IPs suspeitos
CREATE INDEX IF NOT EXISTS idx_suspicious_ips_ip_address ON suspicious_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_suspicious_ips_is_blocked ON suspicious_ips(is_blocked);
CREATE INDEX IF NOT EXISTS idx_suspicious_ips_risk_level ON suspicious_ips(risk_level);

-- Tabela de configurações de segurança
CREATE TABLE IF NOT EXISTS security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Índice para configurações de segurança
CREATE INDEX IF NOT EXISTS idx_security_settings_key ON security_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_security_settings_active ON security_settings(is_active);

-- =====================================================
-- FUNÇÕES DE AUDITORIA
-- =====================================================

-- Função para registrar eventos de segurança
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type TEXT,
    p_user_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id TEXT DEFAULT NULL,
    p_action TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_risk_level TEXT DEFAULT 'low',
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    log_id UUID;
BEGIN
    -- Validar risk_level
    IF p_risk_level NOT IN ('low', 'medium', 'high', 'critical') THEN
        p_risk_level := 'low';
    END IF;
    
    -- Inserir log
    INSERT INTO security_audit_log (
        event_type, user_id, session_id, ip_address, user_agent,
        resource_type, resource_id, action, details, risk_level, metadata
    ) VALUES (
        p_event_type, p_user_id, p_session_id, p_ip_address, p_user_agent,
        p_resource_type, p_resource_id, p_action, p_details, p_risk_level, p_metadata
    ) RETURNING id INTO log_id;
    
    -- Se for evento crítico, alertar administradores
    IF p_risk_level IN ('high', 'critical') THEN
        PERFORM alert_administrators(log_id, p_event_type, p_risk_level);
    END IF;
    
    RETURN log_id;
END;
$$;

-- Função para alertar administradores sobre eventos críticos
CREATE OR REPLACE FUNCTION alert_administrators(
    p_log_id UUID,
    p_event_type TEXT,
    p_risk_level TEXT
) RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Inserir notificação para administradores
    INSERT INTO admin_notifications (type, title, message, severity, metadata)
    SELECT 
        'security_alert',
        'Evento de Segurança ' || UPPER(p_risk_level),
        'Evento crítico detectado: ' || p_event_type,
        p_risk_level,
        jsonb_build_object('log_id', p_log_id, 'event_type', p_event_type)
    WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_notifications');
    
    -- Log do alerta
    INSERT INTO security_audit_log (event_type, action, details, risk_level)
    VALUES ('admin_alert', 'security_alert_sent', 
            jsonb_build_object('original_log_id', p_log_id, 'alert_type', p_event_type), 
            'low');
END;
$$;

-- Função para verificar IP suspeito
CREATE OR REPLACE FUNCTION check_suspicious_ip(
    p_ip_address INET
) RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    is_suspicious BOOLEAN := FALSE;
    ip_record RECORD;
BEGIN
    -- Verificar se IP está na lista de suspeitos
    SELECT * INTO ip_record 
    FROM suspicious_ips 
    WHERE ip_address = p_ip_address 
    AND (NOT is_blocked OR blocked_until > NOW());
    
    IF FOUND THEN
        is_suspicious := TRUE;
        
        -- Atualizar última atividade
        UPDATE suspicious_ips 
        SET last_activity = NOW(), 
            violation_count = violation_count + 1
        WHERE ip_address = p_ip_address;
    END IF;
    
    RETURN is_suspicious;
END;
$$;

-- Função para adicionar IP suspeito
CREATE OR REPLACE FUNCTION add_suspicious_ip(
    p_ip_address INET,
    p_reason TEXT,
    p_risk_level TEXT DEFAULT 'medium',
    p_block_duration INTERVAL DEFAULT '1 hour'
) RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    ip_id UUID;
BEGIN
    -- Inserir ou atualizar IP suspeito
    INSERT INTO suspicious_ips (
        ip_address, reason, risk_level, is_blocked, blocked_until
    ) VALUES (
        p_ip_address, p_reason, p_risk_level, TRUE, NOW() + p_block_duration
    )
    ON CONFLICT (ip_address) DO UPDATE SET
        reason = EXCLUDED.reason,
        risk_level = EXCLUDED.risk_level,
        last_activity = NOW(),
        violation_count = suspicious_ips.violation_count + 1,
        is_blocked = TRUE,
        blocked_until = NOW() + p_block_duration
    RETURNING id INTO ip_id;
    
    -- Log do bloqueio
    PERFORM log_security_event(
        'ip_blocked',
        NULL,
        NULL,
        p_ip_address,
        NULL,
        'ip_address',
        p_ip_address::TEXT,
        'ip_blocked',
        jsonb_build_object('reason', p_reason, 'duration', p_block_duration),
        p_risk_level
    );
    
    RETURN ip_id;
END;
$$;

-- Função para limpar logs antigos (retenção de dados)
CREATE OR REPLACE FUNCTION cleanup_old_security_logs(
    p_retention_days INTEGER DEFAULT 90
) RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deletar logs antigos (exceto eventos críticos)
    DELETE FROM security_audit_log 
    WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL
    AND risk_level NOT IN ('high', 'critical');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da limpeza
    PERFORM log_security_event(
        'data_retention',
        NULL,
        NULL,
        NULL,
        NULL,
        'security_logs',
        NULL,
        'cleanup_old_logs',
        jsonb_build_object('deleted_count', deleted_count, 'retention_days', p_retention_days),
        'low'
    );
    
    RETURN deleted_count;
END;
$$;

-- =====================================================
-- TRIGGERS DE AUDITORIA
-- =====================================================

-- Trigger para auditoria de mudanças em usuários
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Verificar mudanças importantes
        IF OLD.email != NEW.email THEN
            PERFORM log_security_event(
                'email_change',
                NEW.id,
                NULL,
                NULL,
                NULL,
                'user',
                NEW.id::TEXT,
                'email_changed',
                jsonb_build_object('old_email', OLD.email, 'new_email', NEW.email),
                'medium'
            );
        END IF;
        
        IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
            PERFORM log_security_event(
                'email_verification',
                NEW.id,
                NULL,
                NULL,
                NULL,
                'user',
                NEW.id::TEXT,
                'email_verified',
                jsonb_build_object('email', NEW.email, 'verified_at', NEW.email_confirmed_at),
                'low'
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Aplicar trigger aos usuários (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS trigger_audit_user_changes ON auth.users;
        CREATE TRIGGER trigger_audit_user_changes
            AFTER UPDATE ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION audit_user_changes();
    END IF;
END
$$;

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para security_audit_log
CREATE POLICY "Admins can view all security logs" ON security_audit_log
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own security logs" ON security_audit_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert security logs" ON security_audit_log
    FOR INSERT WITH CHECK (true);

-- Políticas para user_email_verifications
CREATE POLICY "Users can view their own email verifications" ON user_email_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email verifications" ON user_email_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all email verifications" ON user_email_verifications
    FOR SELECT USING (is_admin(auth.uid()));

-- Políticas para user_verification_attempts
CREATE POLICY "Users can view their own verification attempts" ON user_verification_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert verification attempts" ON user_verification_attempts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all verification attempts" ON user_verification_attempts
    FOR SELECT USING (is_admin(auth.uid()));

-- Políticas para user_sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert sessions" ON user_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all sessions" ON user_sessions
    FOR ALL USING (is_admin(auth.uid()));

-- Políticas para suspicious_ips
CREATE POLICY "Only admins can manage suspicious IPs" ON suspicious_ips
    FOR ALL USING (is_admin(auth.uid()));

-- Políticas para security_settings
CREATE POLICY "Only admins can manage security settings" ON security_settings
    FOR ALL USING (is_admin(auth.uid()));

-- =====================================================
-- CONFIGURAÇÕES INICIAIS
-- =====================================================

-- Inserir configurações padrão de segurança
INSERT INTO security_settings (setting_key, setting_value, description) VALUES
    ('max_login_attempts', '5', 'Máximo de tentativas de login por IP/usuário'),
    ('login_lockout_duration', '900', 'Duração do bloqueio após exceder tentativas (segundos)'),
    ('session_timeout', '3600', 'Timeout de sessão inativa (segundos)'),
    ('password_min_length', '8', 'Comprimento mínimo da senha'),
    ('require_email_verification', 'true', 'Exigir verificação de e-mail'),
    ('max_file_upload_size', '10485760', 'Tamanho máximo de upload (bytes)'),
    ('allowed_file_types', '["image/jpeg", "image/png", "image/webp", "application/pdf"]', 'Tipos de arquivo permitidos'),
    ('rate_limit_window', '900', 'Janela de rate limiting (segundos)'),
    ('rate_limit_max_requests', '100', 'Máximo de requests por janela'),
    ('audit_log_retention_days', '90', 'Dias de retenção dos logs de auditoria')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE security_audit_log IS 'Log completo de eventos de segurança do sistema';
COMMENT ON TABLE user_email_verifications IS 'Registro de verificações de e-mail dos usuários';
COMMENT ON TABLE user_verification_attempts IS 'Tentativas de verificação para rate limiting';
COMMENT ON TABLE user_sessions IS 'Sessões ativas e históricas dos usuários';
COMMENT ON TABLE suspicious_ips IS 'IPs identificados como suspeitos ou maliciosos';
COMMENT ON TABLE security_settings IS 'Configurações de segurança do sistema';

COMMENT ON FUNCTION log_security_event IS 'Função principal para registrar eventos de segurança';
COMMENT ON FUNCTION check_suspicious_ip IS 'Verifica se um IP está na lista de suspeitos';
COMMENT ON FUNCTION add_suspicious_ip IS 'Adiciona um IP à lista de suspeitos';
COMMENT ON FUNCTION cleanup_old_security_logs IS 'Remove logs antigos conforme política de retenção';

-- =====================================================
-- JOBS DE MANUTENÇÃO
-- =====================================================

-- Criar extensão pg_cron se disponível (para limpeza automática)
DO $$
BEGIN
    -- Tentar criar job de limpeza automática (se pg_cron estiver disponível)
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Limpeza diária às 2:00 AM
        PERFORM cron.schedule('cleanup-security-logs', '0 2 * * *', 'SELECT cleanup_old_security_logs();');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- pg_cron não disponível, ignorar
        NULL;
END
$$;