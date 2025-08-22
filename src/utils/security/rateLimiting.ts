/**
 * Sistema de Rate Limiting Cliente-Side
 * OneDrip - Segurança Avançada
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitState {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}

class ClientRateLimit {
  private storage: Map<string, RateLimitState> = new Map();
  private readonly storageKey = 'onedrip_rate_limits';

  constructor() {
    this.loadFromStorage();
    this.startCleanupTimer();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.storage = new Map(Object.entries(data));
      }
    } catch {
      // Falha silenciosa no carregamento
    }
  }

  private saveToStorage() {
    try {
      const data = Object.fromEntries(this.storage);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // Falha silenciosa no salvamento
    }
  }

  private startCleanupTimer() {
    // Limpeza apenas quando necessário, não constantemente
    if (!window.__RATE_LIMIT_CLEANUP__) {
      window.__RATE_LIMIT_CLEANUP__ = true;
      setInterval(() => this.cleanup(), 5 * 60000); // Limpeza a cada 5 minutos
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, state] of this.storage.entries()) {
      // Remover entradas expiradas
      if (state.blockedUntil && state.blockedUntil < now) {
        this.storage.delete(key);
      } else if (now - state.firstAttempt > 24 * 60 * 60 * 1000) {
        // Remover entradas com mais de 24h
        this.storage.delete(key);
      }
    }
    this.saveToStorage();
  }

  checkLimit(key: string, config: RateLimitConfig): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const state = this.storage.get(key);

    // Verificar se está bloqueado
    if (state?.blockedUntil && state.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: state.blockedUntil,
        retryAfter: Math.ceil((state.blockedUntil - now) / 1000)
      };
    }

    // Se não há estado ou a janela expirou, iniciar nova janela
    if (!state || (now - state.firstAttempt) > config.windowMs) {
      const newState: RateLimitState = {
        attempts: 1,
        firstAttempt: now
      };
      this.storage.set(key, newState);
      this.saveToStorage();
      
      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetTime: now + config.windowMs
      };
    }

    // Incrementar tentativas
    state.attempts++;
    
    if (state.attempts > config.maxAttempts) {
      // Bloquear se necessário
      if (config.blockDurationMs) {
        state.blockedUntil = now + config.blockDurationMs;
      }
      
      this.storage.set(key, state);
      this.saveToStorage();
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: state.firstAttempt + config.windowMs,
        retryAfter: config.blockDurationMs ? Math.ceil(config.blockDurationMs / 1000) : undefined
      };
    }

    this.storage.set(key, state);
    this.saveToStorage();

    return {
      allowed: true,
      remaining: config.maxAttempts - state.attempts,
      resetTime: state.firstAttempt + config.windowMs
    };
  }

  reset(key: string) {
    this.storage.delete(key);
    this.saveToStorage();
  }

  isBlocked(key: string): boolean {
    const state = this.storage.get(key);
    return !!(state?.blockedUntil && state.blockedUntil > Date.now());
  }
}

// Configurações padrão por tipo de ação
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 30 * 60 * 1000 // 30 minutos de bloqueio
  },
  signup: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
    blockDurationMs: 2 * 60 * 60 * 1000 // 2 horas de bloqueio
  },
  password_reset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
    blockDurationMs: 4 * 60 * 60 * 1000 // 4 horas de bloqueio
  },
  budget_creation: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minuto
  },
  search: {
    maxAttempts: 30,
    windowMs: 60 * 1000, // 1 minuto
  },
  api_call: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minuto
  }
};

export const clientRateLimit = new ClientRateLimit();

// Hook para usar rate limiting
export const useRateLimit = (action: string, customConfig?: Partial<RateLimitConfig>) => {
  const config = { ...RATE_LIMIT_CONFIGS[action], ...customConfig };
  
  const checkLimit = (identifier?: string) => {
    const key = `${action}:${identifier || 'global'}`;
    return clientRateLimit.checkLimit(key, config);
  };

  const reset = (identifier?: string) => {
    const key = `${action}:${identifier || 'global'}`;
    clientRateLimit.reset(key);
  };

  const isBlocked = (identifier?: string) => {
    const key = `${action}:${identifier || 'global'}`;
    return clientRateLimit.isBlocked(key);
  };

  return { checkLimit, reset, isBlocked };
};

// Utilitário para obter identificador do cliente
export const getClientIdentifier = (): string => {
  // Usar fingerprint baseado em características do navegador
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('fingerprint', 10, 10);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // Hash simples
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
};