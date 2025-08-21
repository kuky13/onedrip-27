/**
 * CONFIGURAÇÃO CENTRALIZADA DE SEGURANÇA
 * 
 * Este arquivo centraliza todas as configurações de segurança do sistema,
 * incluindo validação de arquivos, rate limiting, CSP, auditoria e verificação de e-mail.
 * 
 * @author Security Team
 * @version 2.0.0
 * @compliance OWASP Top 10, LGPD
 */

import { FileValidationOptions } from '../utils/secureFileValidation';
import { RateLimitConfig } from '../utils/advancedRateLimiting';

// =====================================================
// CONFIGURAÇÕES GERAIS DE SEGURANÇA
// =====================================================

export const SECURITY_CONFIG = {
  // Configurações de sessão
  SESSION: {
    TIMEOUT_MINUTES: 60,
    REFRESH_THRESHOLD_MINUTES: 10,
    MAX_CONCURRENT_SESSIONS: 3,
    REQUIRE_REAUTH_FOR_SENSITIVE: true,
  },

  // Configurações de autenticação
  AUTH: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 15,
    PASSWORD_MIN_LENGTH: 8,
    REQUIRE_2FA_FOR_ADMIN: true,
    JWT_EXPIRY_HOURS: 24,
  },

  // Configurações de verificação de e-mail
  EMAIL_VERIFICATION: {
    REQUIRED_FOR_CRITICAL_ACTIONS: true,
    VERIFICATION_VALIDITY_HOURS: 24,
    MAX_VERIFICATION_ATTEMPTS: 3,
    RESEND_COOLDOWN_MINUTES: 5,
    CRITICAL_ACTIONS: [
      'financial_transaction',
      'data_export',
      'admin_action',
      'sensitive_data_access',
      'account_deletion',
      'password_change',
      'email_change',
      'service_order_creation',
      'budget_approval',
    ] as const,
  },

  // Configurações de monitoramento
  MONITORING: {
    ENABLE_REAL_TIME_ALERTS: true,
    SUSPICIOUS_ACTIVITY_THRESHOLD: 10,
    AUTO_BLOCK_SUSPICIOUS_IPS: true,
    LOG_ALL_API_CALLS: true,
    ALERT_ADMIN_ON_CRITICAL: true,
  },

  // Configurações de dados sensíveis
  DATA_PROTECTION: {
    ENCRYPT_PII: true,
    MASK_SENSITIVE_LOGS: true,
    AUTO_DELETE_TEMP_FILES: true,
    SECURE_HEADERS_REQUIRED: true,
  },

  // Configurações de compliance
  COMPLIANCE: {
    LGPD_ENABLED: true,
    AUDIT_ALL_ACTIONS: true,
    DATA_RETENTION_DAYS: 90,
    REQUIRE_CONSENT_TRACKING: true,
  },
} as const;

// =====================================================
// CONFIGURAÇÕES DE VALIDAÇÃO DE ARQUIVOS
// =====================================================

export const FILE_SECURITY_CONFIG: Record<string, FileValidationOptions> = {
  // Upload de logo da empresa
  COMPANY_LOGO: {
    maxSize: 3 * 1024 * 1024, // 3MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    requireSignatureValidation: true,
    scanForMalware: true,
    validateImageDimensions: true,
    maxDimensions: { width: 2000, height: 2000 },
    minDimensions: { width: 100, height: 100 },
    stripMetadata: true,
    sanitizeFilename: true,
    quarantineOnSuspicion: true,
  },

  // Anexos de ordem de serviço
  SERVICE_ATTACHMENTS: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ],
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.webp', '.gif',
      '.pdf',
      '.doc', '.docx',
      '.xls', '.xlsx',
      '.txt',
    ],
    requireSignatureValidation: true,
    scanForMalware: true,
    validateImageDimensions: false,
    stripMetadata: true,
    sanitizeFilename: true,
    quarantineOnSuspicion: true,
  },

  // Assets administrativos
  ADMIN_ASSETS: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    requireSignatureValidation: true,
    scanForMalware: true,
    validateImageDimensions: true,
    maxDimensions: { width: 4000, height: 4000 },
    stripMetadata: true,
    sanitizeFilename: true,
    quarantineOnSuspicion: true,
  },

  // Documentos gerais
  GENERAL_DOCUMENTS: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    allowedExtensions: [
      '.pdf',
      '.doc', '.docx',
      '.xls', '.xlsx',
      '.txt', '.csv',
    ],
    requireSignatureValidation: true,
    scanForMalware: true,
    validateImageDimensions: false,
    stripMetadata: false, // Manter metadados em documentos
    sanitizeFilename: true,
    quarantineOnSuspicion: true,
  },
};

// =====================================================
// CONFIGURAÇÕES DE RATE LIMITING
// =====================================================

export const RATE_LIMIT_CONFIG: Record<string, RateLimitConfig> = {
  // Autenticação
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5,
    blockDurationMs: 15 * 60 * 1000, // 15 minutos
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
  },

  REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 3,
    blockDurationMs: 60 * 60 * 1000, // 1 hora
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
  },

  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 3,
    blockDurationMs: 60 * 60 * 1000, // 1 hora
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
  },

  // API Calls
  API_GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100,
    blockDurationMs: 5 * 60 * 1000, // 5 minutos
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
    enableSuspiciousDetection: true,
    suspiciousThreshold: 50,
  },

  API_SENSITIVE: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 20,
    blockDurationMs: 30 * 60 * 1000, // 30 minutos
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Uploads
  FILE_UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 20,
    blockDurationMs: 30 * 60 * 1000, // 30 minutos
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
    enableSuspiciousDetection: true,
    suspiciousThreshold: 10,
  },

  // Orçamentos
  BUDGET_CREATION: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 10,
    blockDurationMs: 60 * 60 * 1000, // 1 hora
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
    enableSuspiciousDetection: true,
    suspiciousThreshold: 5,
  },

  // Exportação de dados
  DATA_EXPORT: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 5,
    blockDurationMs: 2 * 60 * 60 * 1000, // 2 horas
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
    enableSuspiciousDetection: true,
    suspiciousThreshold: 3,
  },

  // Busca
  SEARCH: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 50,
    blockDurationMs: 10 * 60 * 1000, // 10 minutos
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
    enableSuspiciousDetection: true,
    suspiciousThreshold: 30,
  },

  // Ações administrativas
  ADMIN_ACTIONS: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 50,
    blockDurationMs: 60 * 60 * 1000, // 1 hora
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    enableSuspiciousDetection: true,
    suspiciousThreshold: 25,
  },
};

// =====================================================
// CONFIGURAÇÕES DE CSP (Content Security Policy)
// =====================================================

export const CSP_CONFIG = {
  // Diretivas básicas
  DEFAULT_SRC: ["'self'"],
  SCRIPT_SRC: [
    "'self'",
    "'unsafe-hashes'", // Para hashes específicos
    // Domínios confiáveis para scripts
    "https://cdn.jsdelivr.net",
    "https://unpkg.com",
  ],
  STYLE_SRC: [
    "'self'",
    "'unsafe-inline'", // Necessário para styled-components/CSS-in-JS
    "https://fonts.googleapis.com",
  ],
  IMG_SRC: [
    "'self'",
    "data:",
    "blob:",
    "https:", // Para imagens externas
  ],
  FONT_SRC: [
    "'self'",
    "https://fonts.gstatic.com",
  ],
  CONNECT_SRC: [
    "'self'",
    "https://*.supabase.co", // Supabase
    "wss://*.supabase.co", // WebSocket Supabase
  ],
  MEDIA_SRC: ["'self'", "blob:"],
  OBJECT_SRC: ["'none'"],
  BASE_URI: ["'self'"],
  FORM_ACTION: ["'self'"],
  FRAME_ANCESTORS: ["'none'"],
  UPGRADE_INSECURE_REQUESTS: true,
  BLOCK_ALL_MIXED_CONTENT: true,
  
  // Configurações de relatório
  REPORT_URI: "/api/csp-report",
  REPORT_TO: "csp-endpoint",
  
  // Modo de desenvolvimento
  DEVELOPMENT_MODE: process.env.NODE_ENV === 'development',
} as const;

// =====================================================
// CONFIGURAÇÕES DE HEADERS DE SEGURANÇA
// =====================================================

export const SECURITY_HEADERS = {
  // Strict Transport Security
  HSTS: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true,
  },
  
  // X-Frame-Options
  FRAME_OPTIONS: 'DENY',
  
  // X-Content-Type-Options
  CONTENT_TYPE_OPTIONS: 'nosniff',
  
  // Referrer Policy
  REFERRER_POLICY: 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  PERMISSIONS_POLICY: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: [],
  },
  
  // Cross-Origin Policies
  CROSS_ORIGIN_EMBEDDER_POLICY: 'require-corp',
  CROSS_ORIGIN_OPENER_POLICY: 'same-origin',
  CROSS_ORIGIN_RESOURCE_POLICY: 'same-origin',
} as const;

// =====================================================
// CONFIGURAÇÕES DE AUDITORIA
// =====================================================

export const AUDIT_CONFIG = {
  // Eventos que devem ser sempre auditados
  CRITICAL_EVENTS: [
    'user_login',
    'user_logout',
    'password_change',
    'email_change',
    'permission_change',
    'data_export',
    'file_upload',
    'file_download',
    'admin_action',
    'security_violation',
    'suspicious_activity',
  ] as const,
  
  // Configurações de retenção
  RETENTION: {
    CRITICAL_EVENTS_DAYS: 365, // 1 ano
    NORMAL_EVENTS_DAYS: 90, // 3 meses
    SYSTEM_LOGS_DAYS: 30, // 1 mês
  },
  
  // Configurações de alertas
  ALERTS: {
    ENABLE_REAL_TIME: true,
    CRITICAL_THRESHOLD: 1, // Alertar imediatamente
    SUSPICIOUS_THRESHOLD: 5, // Alertar após 5 eventos
    ADMIN_EMAIL_ALERTS: true,
    WEBHOOK_ALERTS: true,
  },
  
  // Configurações de batch
  BATCH: {
    SIZE: 100,
    INTERVAL_MS: 5000, // 5 segundos
    MAX_RETRIES: 3,
  },
} as const;

// =====================================================
// CONFIGURAÇÕES DE AMBIENTE
// =====================================================

export const ENVIRONMENT_CONFIG = {
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
  
  // URLs e endpoints
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
  
  // Configurações específicas por ambiente
  SECURITY_LEVEL: process.env.NODE_ENV === 'production' ? 'strict' : 'normal',
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
} as const;

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export type SecurityEventType = typeof AUDIT_CONFIG.CRITICAL_EVENTS[number];
export type CriticalAction = typeof SECURITY_CONFIG.EMAIL_VERIFICATION.CRITICAL_ACTIONS[number];
export type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;
export type FileUploadType = keyof typeof FILE_SECURITY_CONFIG;

export interface SecurityContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityViolation {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: SecurityContext;
  metadata?: Record<string, any>;
}

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

/**
 * Verifica se uma ação é considerada crítica
 */
export function isCriticalAction(action: string): action is CriticalAction {
  return SECURITY_CONFIG.EMAIL_VERIFICATION.CRITICAL_ACTIONS.includes(action as CriticalAction);
}

/**
 * Obtém a configuração de rate limit para um tipo específico
 */
export function getRateLimitConfig(type: RateLimitType): RateLimitConfig {
  return RATE_LIMIT_CONFIG[type];
}

/**
 * Obtém a configuração de validação de arquivo para um tipo específico
 */
export function getFileValidationConfig(type: FileUploadType): FileValidationOptions {
  return FILE_SECURITY_CONFIG[type];
}

/**
 * Verifica se o ambiente atual é seguro para operações sensíveis
 */
export function isSecureEnvironment(): boolean {
  return ENVIRONMENT_CONFIG.IS_PRODUCTION || 
         (ENVIRONMENT_CONFIG.IS_DEVELOPMENT && process.env.VITE_ENABLE_SECURITY === 'true');
}

/**
 * Gera um contexto de segurança padrão
 */
export function createSecurityContext(overrides: Partial<SecurityContext> = {}): SecurityContext {
  return {
    timestamp: new Date(),
    riskLevel: 'low',
    ...overrides,
  };
}

export default {
  SECURITY_CONFIG,
  FILE_SECURITY_CONFIG,
  RATE_LIMIT_CONFIG,
  CSP_CONFIG,
  SECURITY_HEADERS,
  AUDIT_CONFIG,
  ENVIRONMENT_CONFIG,
};