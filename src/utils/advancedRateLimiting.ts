/**
 * SISTEMA AVANÇADO DE RATE LIMITING
 * Implementa múltiplas estratégias de limitação de taxa
 * Proteção contra ataques de força bruta e DDoS
 */

import { securityLogger, SecurityEventType } from './securityAuditLogger';

export interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requests na janela
  blockDurationMs?: number; // Duração do bloqueio após exceder
  skipSuccessfulRequests?: boolean; // Não contar requests bem-sucedidos
  skipFailedRequests?: boolean; // Não contar requests falhados
  keyGenerator?: (identifier: string) => string; // Gerador de chave personalizado
  onLimitReached?: (identifier: string, info: RateLimitInfo) => void;
  whitelist?: string[]; // IPs ou usuários na whitelist
  blacklist?: string[]; // IPs ou usuários na blacklist
  enableSuspiciousDetection?: boolean;
  suspiciousThreshold?: number;
  maxAttempts?: number;
}

export interface RateLimitInfo {
  totalHits: number;
  totalHitsInWindow: number;
  remainingRequests: number;
  resetTime: Date;
  isBlocked: boolean;
  blockExpiresAt?: Date;
}

export interface RateLimitResult {
  allowed: boolean;
  info: RateLimitInfo;
  retryAfter?: number; // Segundos até poder tentar novamente
}

// Configurações predefinidas para diferentes tipos de ação
export const RATE_LIMIT_CONFIGS = {
  // Autenticação
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5, // 5 tentativas por 15 min
    blockDurationMs: 30 * 60 * 1000, // Bloquear por 30 min
    skipSuccessfulRequests: true
  },
  
  SIGNUP: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 3, // 3 cadastros por hora
    blockDurationMs: 2 * 60 * 60 * 1000 // Bloquear por 2 horas
  },
  
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 3, // 3 tentativas por hora
    blockDurationMs: 60 * 60 * 1000 // Bloquear por 1 hora
  },
  
  EMAIL_VERIFICATION: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 3, // 3 envios por hora
    blockDurationMs: 2 * 60 * 60 * 1000 // Bloquear por 2 horas
  },
  
  // API Calls
  API_GENERAL: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 60, // 60 requests por minuto
    blockDurationMs: 5 * 60 * 1000 // Bloquear por 5 min
  },
  
  API_SENSITIVE: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10, // 10 requests por minuto
    blockDurationMs: 15 * 60 * 1000 // Bloquear por 15 min
  },
  
  // Uploads
  FILE_UPLOAD: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 5, // 5 uploads por minuto
    blockDurationMs: 10 * 60 * 1000 // Bloquear por 10 min
  },
  
  // Orçamentos
  CREATE_BUDGET: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 10, // 10 orçamentos por hora
    blockDurationMs: 30 * 60 * 1000 // Bloquear por 30 min
  },
  
  // Exportação de dados
  DATA_EXPORT: {
    windowMs: 24 * 60 * 60 * 1000, // 24 horas
    maxRequests: 5, // 5 exportações por dia
    blockDurationMs: 24 * 60 * 60 * 1000 // Bloquear por 24 horas
  },
  
  // Busca/Pesquisa
  SEARCH: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 30, // 30 buscas por minuto
    blockDurationMs: 5 * 60 * 1000 // Bloquear por 5 min
  },
  
  // Ações administrativas
  ADMIN_ACTION: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 20, // 20 ações por minuto
    blockDurationMs: 15 * 60 * 1000 // Bloquear por 15 min
  }
} as const;

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockExpiresAt?: number;
  firstRequest: number;
}

class AdvancedRateLimiter {
  private static instance: AdvancedRateLimiter;
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;
  private suspiciousIPs = new Set<string>();
  private trustedIPs = new Set<string>();

  private constructor() {
    // Limpeza periódica do store
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Limpar a cada 5 minutos

    // IPs confiáveis (localhost, etc.)
    this.trustedIPs.add('127.0.0.1');
    this.trustedIPs.add('::1');
    this.trustedIPs.add('localhost');
  }

  public static getInstance(): AdvancedRateLimiter {
    if (!AdvancedRateLimiter.instance) {
      AdvancedRateLimiter.instance = new AdvancedRateLimiter();
    }
    return AdvancedRateLimiter.instance;
  }

  /**
   * Verifica se uma ação é permitida
   */
  public checkLimit(
    identifier: string,
    action: keyof typeof RATE_LIMIT_CONFIGS,
    customConfig?: Partial<RateLimitConfig>
  ): RateLimitResult {
    const config = { ...RATE_LIMIT_CONFIGS[action], ...customConfig };
    const key = config.keyGenerator ? config.keyGenerator(identifier) : `${action}:${identifier}`;
    
    // Verificar whitelist
    if (config.whitelist?.includes(identifier) || this.trustedIPs.has(identifier)) {
      return {
        allowed: true,
        info: {
          totalHits: 0,
          totalHitsInWindow: 0,
          remainingRequests: config.maxRequests,
          resetTime: new Date(Date.now() + config.windowMs),
          isBlocked: false
        }
      };
    }

    // Verificar blacklist
    if (config.blacklist?.includes(identifier) || this.suspiciousIPs.has(identifier)) {
      this.logSecurityEvent(identifier, action, 'blacklisted_access_attempt');
      return {
        allowed: false,
        info: {
          totalHits: 0,
          totalHitsInWindow: 0,
          remainingRequests: 0,
          resetTime: new Date(Date.now() + config.windowMs),
          isBlocked: true,
          blockExpiresAt: new Date(Date.now() + (config.blockDurationMs || config.windowMs))
        },
        retryAfter: Math.ceil((config.blockDurationMs || config.windowMs) / 1000)
      };
    }

    const now = Date.now();
    let entry = this.store.get(key);

    // Inicializar entrada se não existir
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false,
        firstRequest: now
      };
    }

    // Verificar se ainda está bloqueado
    if (entry.blocked && entry.blockExpiresAt && now < entry.blockExpiresAt) {
      const retryAfter = Math.ceil((entry.blockExpiresAt - now) / 1000);
      return {
        allowed: false,
        info: {
          totalHits: entry.count,
          totalHitsInWindow: entry.count,
          remainingRequests: 0,
          resetTime: new Date(entry.resetTime),
          isBlocked: true,
          blockExpiresAt: new Date(entry.blockExpiresAt)
        },
        retryAfter
      };
    }

    // Reset da janela se expirou
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + config.windowMs;
      entry.blocked = false;
      entry.blockExpiresAt = undefined;
      entry.firstRequest = now;
    }

    // Incrementar contador
    entry.count++;
    this.store.set(key, entry);

    const remainingRequests = Math.max(0, config.maxRequests - entry.count);
    const info: RateLimitInfo = {
      totalHits: entry.count,
      totalHitsInWindow: entry.count,
      remainingRequests,
      resetTime: new Date(entry.resetTime),
      isBlocked: false
    };

    // Verificar se excedeu o limite
    if (entry.count > config.maxRequests) {
      // Bloquear
      entry.blocked = true;
      entry.blockExpiresAt = now + (config.blockDurationMs || config.windowMs);
      info.isBlocked = true;
      info.blockExpiresAt = new Date(entry.blockExpiresAt);
      
      this.store.set(key, entry);
      
      // Log do evento
      this.logSecurityEvent(identifier, action, 'rate_limit_exceeded');
      
      // Callback personalizado
      if (config.onLimitReached) {
        config.onLimitReached(identifier, info);
      }
      
      // Detectar comportamento suspeito
      this.detectSuspiciousBehavior(identifier, action, entry);
      
      const retryAfter = Math.ceil((entry.blockExpiresAt - now) / 1000);
      return {
        allowed: false,
        info,
        retryAfter
      };
    }

    return {
      allowed: true,
      info
    };
  }

  /**
   * Detecta comportamento suspeito
   */
  private detectSuspiciousBehavior(
    identifier: string, 
    action: keyof typeof RATE_LIMIT_CONFIGS, 
    entry: RateLimitEntry
  ): void {
    const now = Date.now();
    const requestRate = entry.count / ((now - entry.firstRequest) / 1000); // requests por segundo
    
    // Comportamentos suspeitos
    const isSuspicious = 
      requestRate > 10 || // Mais de 10 requests por segundo
      entry.count > RATE_LIMIT_CONFIGS[action].maxRequests * 3 || // 3x o limite
      (action === 'LOGIN' && entry.count > 10); // Muitas tentativas de login
    
    if (isSuspicious) {
      this.suspiciousIPs.add(identifier);
      
      securityLogger.logSuspiciousActivity('rate_limit_abuse', {
        identifier,
        action,
        request_rate: requestRate,
        total_requests: entry.count,
        time_window: (now - entry.firstRequest) / 1000
      });
      
      // Auto-blacklist temporário para IPs muito suspeitos
      if (requestRate > 50) {
        setTimeout(() => {
          this.suspiciousIPs.delete(identifier);
        }, 24 * 60 * 60 * 1000); // Remove da lista suspeita após 24h
      }
    }
  }

  /**
   * Log de eventos de segurança
   */
  private logSecurityEvent(
    identifier: string, 
    action: keyof typeof RATE_LIMIT_CONFIGS, 
    eventType: string
  ): void {
    securityLogger.logSecurityEvent({
      event_type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      action: eventType,
      details: {
        identifier,
        action,
        timestamp: new Date().toISOString()
      },
      risk_level: 'medium'
    });
  }

  /**
   * Obtém informações sobre um identificador
   */
  public getInfo(
    identifier: string, 
    action: keyof typeof RATE_LIMIT_CONFIGS
  ): RateLimitInfo | null {
    const config = RATE_LIMIT_CONFIGS[action];
    const key = `${action}:${identifier}`;
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    const remainingRequests = Math.max(0, config.maxRequests - entry.count);
    
    return {
      totalHits: entry.count,
      totalHitsInWindow: entry.count,
      remainingRequests,
      resetTime: new Date(entry.resetTime),
      isBlocked: entry.blocked && entry.blockExpiresAt ? now < entry.blockExpiresAt : false,
      blockExpiresAt: entry.blockExpiresAt ? new Date(entry.blockExpiresAt) : undefined
    };
  }

  /**
   * Remove um identificador do rate limiting
   */
  public reset(identifier: string, action?: keyof typeof RATE_LIMIT_CONFIGS): void {
    if (action) {
      const key = `${action}:${identifier}`;
      this.store.delete(key);
    } else {
      // Remove todas as entradas para o identificador
      for (const key of this.store.keys()) {
        if (key.includes(identifier)) {
          this.store.delete(key);
        }
      }
    }
  }

  /**
   * Adiciona um IP à whitelist
   */
  public addToWhitelist(identifier: string): void {
    this.trustedIPs.add(identifier);
    this.suspiciousIPs.delete(identifier);
  }

  /**
   * Remove um IP da whitelist
   */
  public removeFromWhitelist(identifier: string): void {
    this.trustedIPs.delete(identifier);
  }

  /**
   * Adiciona um IP à blacklist
   */
  public addToBlacklist(identifier: string): void {
    this.suspiciousIPs.add(identifier);
  }

  /**
   * Remove um IP da blacklist
   */
  public removeFromBlacklist(identifier: string): void {
    this.suspiciousIPs.delete(identifier);
  }

  /**
   * Obtém estatísticas gerais
   */
  public getStats(): {
    totalEntries: number;
    blockedEntries: number;
    suspiciousIPs: number;
    trustedIPs: number;
  } {
    let blockedEntries = 0;
    const now = Date.now();
    
    for (const entry of this.store.values()) {
      if (entry.blocked && entry.blockExpiresAt && now < entry.blockExpiresAt) {
        blockedEntries++;
      }
    }
    
    return {
      totalEntries: this.store.size,
      blockedEntries,
      suspiciousIPs: this.suspiciousIPs.size,
      trustedIPs: this.trustedIPs.size
    };
  }

  /**
   * Limpeza periódica de entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.store.entries()) {
      // Remover entradas expiradas
      if (now > entry.resetTime && (!entry.blocked || !entry.blockExpiresAt || now > entry.blockExpiresAt)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.store.delete(key));
    
    // Log da limpeza se removeu muitas entradas
    if (keysToDelete.length > 100) {
      console.log(`Rate limiter cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Shutdown do rate limiter
   */
  public shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Instância singleton
export const rateLimiter = AdvancedRateLimiter.getInstance();

// Hook para React
export function useRateLimit() {
  const checkLimit = (
    identifier: string, 
    action: keyof typeof RATE_LIMIT_CONFIGS,
    customConfig?: Partial<RateLimitConfig>
  ) => {
    return rateLimiter.checkLimit(identifier, action, customConfig);
  };

  const getInfo = (identifier: string, action: keyof typeof RATE_LIMIT_CONFIGS) => {
    return rateLimiter.getInfo(identifier, action);
  };

  const reset = (identifier: string, action?: keyof typeof RATE_LIMIT_CONFIGS) => {
    rateLimiter.reset(identifier, action);
  };

  return {
    checkLimit,
    getInfo,
    reset,
    stats: rateLimiter.getStats()
  };
}

// Middleware para verificação automática
export function withRateLimit<T extends (...args: any[]) => any>(
  action: keyof typeof RATE_LIMIT_CONFIGS,
  identifierFn: (...args: Parameters<T>) => string
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const identifier = identifierFn(...args);
      const result = rateLimiter.checkLimit(identifier, action);
      
      if (!result.allowed) {
        const error = new Error(`Rate limit exceeded. Try again in ${result.retryAfter} seconds.`);
        (error as any).rateLimitInfo = result.info;
        throw error;
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Utilitário para obter identificador do usuário
export async function getUserIdentifier(): Promise<string> {
  try {
    // Tentar obter do Supabase
    const { supabase } = await import('../lib/supabase');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.id) {
      return `user:${user.id}`;
    }
    
    // Fallback para fingerprint do navegador
    const fingerprint = await generateBrowserFingerprint();
    return `browser:${fingerprint}`;
    
  } catch (error) {
    // Fallback para IP (seria obtido do backend em produção)
    return `ip:unknown`;
  }
}

// Gera fingerprint do navegador
async function generateBrowserFingerprint(): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint', 2, 2);
  }
  
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
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

// Cleanup ao sair da página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    rateLimiter.shutdown();
  });
}