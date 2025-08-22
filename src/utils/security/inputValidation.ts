/**
 * Utilitários de Validação e Segurança para Entradas do Usuário
 * Sistema OneDrip Blueberry - Auditoria de Segurança 2025
 */

// Padrões perigosos para detecção de SQL Injection
const SQL_INJECTION_PATTERNS = [
  /union\s+select/i,
  /drop\s+table/i,
  /delete\s+from/i,
  /insert\s+into/i,
  /update\s+.*set/i,
  /alter\s+table/i,
  /create\s+table/i,
  /--/,
  /\/\*/,
  /xp_/i,
  /sp_/i,
  /exec\s*\(/i,
  /<script/i
];

// Padrões de XSS
const XSS_PATTERNS = [
  /<script[\s\S]*?>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /expression\s*\(/i,
  /vbscript:/i
];

/**
 * Sanitiza entrada de texto removendo caracteres perigosos
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>&"'();{}[\]]/g, '') // Remove caracteres perigosos
    .replace(/\s+/g, ' ') // Normaliza espaços
    .slice(0, 1000); // Limita tamanho
};

/**
 * Detecta tentativas de SQL Injection
 */
export const detectSQLInjection = (input: string): boolean => {
  if (!input) return false;
  
  const lowerInput = input.toLowerCase();
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(lowerInput));
};

/**
 * Detecta tentativas de XSS
 */
export const detectXSS = (input: string): boolean => {
  if (!input) return false;
  
  return XSS_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Validação completa de entrada
 */
export const validateInput = (input: string, context: 'form' | 'search' | 'admin' = 'form'): { isValid: boolean; sanitized: string; threats: string[]; riskLevel: 'low' | 'medium' | 'high' } => {
  const results = {
    isValid: true,
    sanitized: '',
    threats: [] as string[],
    riskLevel: 'low' as 'low' | 'medium' | 'high'
  };

  if (!input) {
    results.sanitized = '';
    return results;
  }

  // Detectar ameaças
  if (detectSQLInjection(input)) {
    results.threats.push('SQL_INJECTION');
    results.riskLevel = 'high';
    results.isValid = false;
  }

  if (detectXSS(input)) {
    results.threats.push('XSS');
    results.riskLevel = 'high';
    results.isValid = false;
  }

  // Verificar tamanho
  if (input.length > 2000) {
    results.threats.push('OVERSIZED_INPUT');
    results.riskLevel = results.riskLevel === 'high' ? 'high' : 'medium';
  }

  // Sanitizar sempre, independente de ameaças
  results.sanitized = sanitizeInput(input);

  // Para contexto admin, ser mais restritivo
  if (context === 'admin' && results.threats.length > 0) {
    results.isValid = false;
  }

  return results;
};

/**
 * Validação de email com segurança
 */
export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validation = validateInput(email, 'form');
  
  return {
    ...validation,
    isValidEmail: emailRegex.test(email) && validation.isValid,
    sanitized: email.toLowerCase().trim()
  };
};

/**
 * Validação de telefone com segurança
 */
export const validatePhone = (phone: string) => {
  const phoneRegex = /^[\d\s-()]+$/;
  const validation = validateInput(phone, 'form');
  
  return {
    ...validation,
    isValidPhone: phoneRegex.test(phone) && validation.isValid,
    sanitized: phone.replace(/[^\d]/g, '') // Manter apenas números
  };
};

/**
 * Rate limiting simples no cliente
 */
class ClientRateLimit {
  private attempts: Map<string, number[]> = new Map();
  
  checkLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Obter tentativas do período
    const currentAttempts = this.attempts.get(identifier) || [];
    const recentAttempts = currentAttempts.filter(time => time > windowStart);
    
    // Verificar limite
    if (recentAttempts.length >= maxAttempts) {
      return false; // Limite excedido
    }
    
    // Adicionar nova tentativa
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return true; // Dentro do limite
  }
  
  reset(identifier: string) {
    this.attempts.delete(identifier);
  }
}

export const clientRateLimit = new ClientRateLimit();

/**
 * Log de eventos de segurança no cliente
 */
export const logSecurityEvent = (
  eventType: string, 
  details: Record<string, any> = {},
  severity: 'low' | 'medium' | 'high' = 'medium'
) => {
  // Em produção, isso enviaria para o backend
  if (import.meta.env.DEV) {
    console.warn(`[SECURITY] ${eventType}:`, details);
  }
  
  // Aqui você pode implementar envio para o backend
  // fetch('/api/security-events', { method: 'POST', body: JSON.stringify({ eventType, details, severity }) })
};