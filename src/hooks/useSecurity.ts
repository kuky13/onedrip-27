/**
 * HOOK DE SEGURANÇA INTEGRADO
 * 
 * Este hook centraliza todas as funcionalidades de segurança do sistema,
 * fornecendo uma interface unificada para validação de arquivos, rate limiting,
 * auditoria, verificação de e-mail e monitoramento de segurança.
 * 
 * @author Security Team
 * @version 2.0.0
 * @compliance OWASP Top 10, LGPD
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';

// Importar utilitários de segurança
import { useFileValidation } from '../utils/secureFileValidation';
import { useRateLimit } from '../utils/advancedRateLimiting';
import { useEmailVerification } from '../utils/emailVerificationGuard';
import { securityAuditLogger } from '../utils/securityAuditLogger';
import { generateNonce, generateCSPHeader, handleCSPViolation } from '../utils/secureCSP';

// Importar configurações
import {
  SECURITY_CONFIG,
  RATE_LIMIT_CONFIG,
  FILE_SECURITY_CONFIG,
  SecurityContext,
  SecurityViolation,
  SecurityEventType,
  CriticalAction,
  RateLimitType,
  FileUploadType,
  isCriticalAction,
  createSecurityContext,
} from '../config/securityConfig';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

interface SecurityState {
  isSecure: boolean;
  violations: SecurityViolation[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastSecurityCheck: Date | null;
  suspiciousActivityCount: number;
  isBlocked: boolean;
  blockReason?: string;
}

interface SecurityActions {
  // Validação de arquivos
  validateFile: (file: File, type: FileUploadType) => Promise<boolean>;
  
  // Rate limiting
  checkRateLimit: (action: RateLimitType) => Promise<boolean>;
  
  // Verificação de e-mail
  requireEmailVerification: (action: CriticalAction) => Promise<boolean>;
  
  // Auditoria
  logSecurityEvent: (event: SecurityEventType, details?: any) => Promise<void>;
  
  // Monitoramento
  reportSuspiciousActivity: (activity: string, metadata?: any) => Promise<void>;
  reportSecurityViolation: (violation: Omit<SecurityViolation, 'context'>) => Promise<void>;
  
  // CSP
  generateSecureNonce: () => string;
  handleCSPViolation: (violation: any) => void;
  
  // Sessão
  validateSession: () => Promise<boolean>;
  refreshSecurityContext: () => Promise<void>;
  
  // Bloqueio
  blockUser: (reason: string, duration?: number) => Promise<void>;
  unblockUser: () => Promise<void>;
}

interface UseSecurityOptions {
  enableRealTimeMonitoring?: boolean;
  enableAutoBlocking?: boolean;
  suspiciousActivityThreshold?: number;
  sessionValidationInterval?: number;
}

interface UseSecurityReturn {
  state: SecurityState;
  actions: SecurityActions;
  isLoading: boolean;
  error: string | null;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useSecurity(options: UseSecurityOptions = {}): UseSecurityReturn {
  const {
    enableRealTimeMonitoring = true,
    enableAutoBlocking = true,
    suspiciousActivityThreshold = SECURITY_CONFIG.MONITORING.SUSPICIOUS_ACTIVITY_THRESHOLD,
    sessionValidationInterval = 5 * 60 * 1000, // 5 minutos
  } = options;

  // Hooks do Supabase
  const supabase = useSupabaseClient();
  const user = useUser();

  // Hooks de segurança
  const fileValidation = useFileValidation();
  const rateLimit = useRateLimit();
  const emailVerification = useEmailVerification();

  // Estado local
  const [state, setState] = useState<SecurityState>({
    isSecure: true,
    violations: [],
    riskLevel: 'low',
    lastSecurityCheck: null,
    suspiciousActivityCount: 0,
    isBlocked: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs para controle
  const securityContextRef = useRef<SecurityContext | null>(null);
  const sessionValidationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const violationCountRef = useRef(0);

  // =====================================================
  // FUNÇÕES UTILITÁRIAS
  // =====================================================

  /**
   * Cria contexto de segurança atual
   */
  const createCurrentSecurityContext = useCallback((): SecurityContext => {
    return createSecurityContext({
      userId: user?.id,
      sessionId: securityAuditLogger.getSessionId(),
      riskLevel: state.riskLevel,
    });
  }, [user?.id, state.riskLevel]);

  /**
   * Atualiza o nível de risco baseado em violações
   */
  const updateRiskLevel = useCallback((violations: SecurityViolation[]) => {
    const criticalCount = violations.filter(v => v.severity === 'critical').length;
    const highCount = violations.filter(v => v.severity === 'high').length;
    const mediumCount = violations.filter(v => v.severity === 'medium').length;

    let newRiskLevel: SecurityState['riskLevel'] = 'low';

    if (criticalCount > 0) {
      newRiskLevel = 'critical';
    } else if (highCount >= 2) {
      newRiskLevel = 'critical';
    } else if (highCount >= 1 || mediumCount >= 3) {
      newRiskLevel = 'high';
    } else if (mediumCount >= 1) {
      newRiskLevel = 'medium';
    }

    return newRiskLevel;
  }, []);

  /**
   * Verifica se o usuário deve ser bloqueado automaticamente
   */
  const shouldAutoBlock = useCallback((riskLevel: SecurityState['riskLevel'], violationCount: number) => {
    if (!enableAutoBlocking) return false;
    
    return (
      riskLevel === 'critical' ||
      violationCount >= suspiciousActivityThreshold
    );
  }, [enableAutoBlocking, suspiciousActivityThreshold]);

  // =====================================================
  // AÇÕES DE SEGURANÇA
  // =====================================================

  /**
   * Valida um arquivo usando as configurações de segurança
   */
  const validateFile = useCallback(async (file: File, type: FileUploadType): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const config = FILE_SECURITY_CONFIG[type];
      const isValid = await fileValidation.validateFile(file, config);
      
      if (!isValid) {
        await logSecurityEvent('file_validation_failed', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadType: type,
        });
        
        await reportSuspiciousActivity('invalid_file_upload', {
          fileName: file.name,
          fileType: file.type,
          uploadType: type,
        });
      } else {
        await logSecurityEvent('file_validation_success', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadType: type,
        });
      }
      
      return isValid;
    } catch (err) {
      setError(`Erro na validação de arquivo: ${err}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fileValidation]);

  /**
   * Verifica rate limiting para uma ação
   */
  const checkRateLimit = useCallback(async (action: RateLimitType): Promise<boolean> => {
    try {
      const config = RATE_LIMIT_CONFIG[action];
      const isAllowed = await rateLimit.checkLimit(action, config);
      
      if (!isAllowed) {
        await logSecurityEvent('rate_limit_exceeded', {
          action,
          config,
        });
        
        await reportSuspiciousActivity('rate_limit_violation', {
          action,
          threshold: config.maxAttempts,
        });
        
        toast.error('Muitas tentativas. Tente novamente mais tarde.');
      }
      
      return isAllowed;
    } catch (err) {
      setError(`Erro no rate limiting: ${err}`);
      return false;
    }
  }, [rateLimit]);

  /**
   * Requer verificação de e-mail para ações críticas
   */
  const requireEmailVerification = useCallback(async (action: CriticalAction): Promise<boolean> => {
    try {
      if (!isCriticalAction(action)) {
        return true; // Não é ação crítica, permitir
      }
      
      const isVerified = await emailVerification.requireVerification(action);
      
      if (!isVerified) {
        await logSecurityEvent('email_verification_required', {
          action,
          userId: user?.id,
        });
        
        toast.warning('Verificação de e-mail necessária para esta ação.');
      } else {
        await logSecurityEvent('email_verification_success', {
          action,
          userId: user?.id,
        });
      }
      
      return isVerified;
    } catch (err) {
      setError(`Erro na verificação de e-mail: ${err}`);
      return false;
    }
  }, [emailVerification, user?.id]);

  /**
   * Registra evento de segurança
   */
  const logSecurityEvent = useCallback(async (event: SecurityEventType, details?: any): Promise<void> => {
    try {
      const context = createCurrentSecurityContext();
      
      await securityAuditLogger.logEvent({
        type: event,
        severity: 'low',
        userId: user?.id,
        details,
        context,
      });
    } catch (err) {
      console.error('Erro ao registrar evento de segurança:', err);
    }
  }, [createCurrentSecurityContext, user?.id]);

  /**
   * Reporta atividade suspeita
   */
  const reportSuspiciousActivity = useCallback(async (activity: string, metadata?: any): Promise<void> => {
    try {
      const context = createCurrentSecurityContext();
      
      await securityAuditLogger.logEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        userId: user?.id,
        details: {
          activity,
          metadata,
          timestamp: new Date().toISOString(),
        },
        context,
      });
      
      // Atualizar contador de atividades suspeitas
      setState(prev => {
        const newCount = prev.suspiciousActivityCount + 1;
        const newRiskLevel = newCount >= suspiciousActivityThreshold ? 'high' : prev.riskLevel;
        
        return {
          ...prev,
          suspiciousActivityCount: newCount,
          riskLevel: newRiskLevel,
        };
      });
      
      violationCountRef.current += 1;
      
      // Verificar se deve bloquear automaticamente
      if (shouldAutoBlock(state.riskLevel, violationCountRef.current)) {
        await blockUser(`Atividade suspeita detectada: ${activity}`);
      }
      
    } catch (err) {
      console.error('Erro ao reportar atividade suspeita:', err);
    }
  }, [createCurrentSecurityContext, user?.id, suspiciousActivityThreshold, shouldAutoBlock, state.riskLevel]);

  /**
   * Reporta violação de segurança
   */
  const reportSecurityViolation = useCallback(async (violation: Omit<SecurityViolation, 'context'>): Promise<void> => {
    try {
      const context = createCurrentSecurityContext();
      const fullViolation: SecurityViolation = {
        ...violation,
        context,
      };
      
      await securityAuditLogger.logEvent({
        type: 'security_violation',
        severity: violation.severity,
        userId: user?.id,
        details: {
          violationType: violation.type,
          description: violation.description,
          metadata: violation.metadata,
        },
        context,
      });
      
      // Atualizar estado com nova violação
      setState(prev => {
        const newViolations = [...prev.violations, fullViolation];
        const newRiskLevel = updateRiskLevel(newViolations);
        
        return {
          ...prev,
          violations: newViolations,
          riskLevel: newRiskLevel,
          isSecure: newRiskLevel !== 'critical',
        };
      });
      
      violationCountRef.current += 1;
      
      // Verificar se deve bloquear automaticamente
      if (shouldAutoBlock(violation.severity as any, violationCountRef.current)) {
        await blockUser(`Violação de segurança: ${violation.description}`);
      }
      
    } catch (err) {
      console.error('Erro ao reportar violação de segurança:', err);
    }
  }, [createCurrentSecurityContext, user?.id, updateRiskLevel, shouldAutoBlock]);

  /**
   * Gera nonce seguro para CSP
   */
  const generateSecureNonce = useCallback((): string => {
    return generateNonce();
  }, []);

  /**
   * Manipula violações de CSP
   */
  const handleCSPViolationCallback = useCallback((violation: any): void => {
    handleCSPViolation(violation);
    
    // Reportar como violação de segurança
    reportSecurityViolation({
      type: 'csp_violation',
      severity: 'medium',
      description: `CSP violation: ${violation['violated-directive']}`,
      metadata: violation,
    });
  }, [reportSecurityViolation]);

  /**
   * Valida sessão atual
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        await logSecurityEvent('session_validation_failed', {
          error: error?.message,
          hasSession: !!session,
        });
        return false;
      }
      
      // Verificar se a sessão não expirou
      const now = Date.now() / 1000;
      if (session.expires_at && session.expires_at < now) {
        await logSecurityEvent('session_expired', {
          expiresAt: session.expires_at,
          currentTime: now,
        });
        return false;
      }
      
      await logSecurityEvent('session_validation_success', {
        sessionId: session.access_token.substring(0, 10) + '...',
      });
      
      return true;
    } catch (err) {
      setError(`Erro na validação de sessão: ${err}`);
      return false;
    }
  }, [supabase, logSecurityEvent]);

  /**
   * Atualiza contexto de segurança
   */
  const refreshSecurityContext = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const context = createCurrentSecurityContext();
      securityContextRef.current = context;
      
      // Validar sessão
      const isSessionValid = await validateSession();
      
      setState(prev => ({
        ...prev,
        lastSecurityCheck: new Date(),
        isSecure: isSessionValid && prev.riskLevel !== 'critical',
      }));
      
      await logSecurityEvent('security_context_refreshed', {
        isSessionValid,
        riskLevel: state.riskLevel,
      });
      
    } catch (err) {
      setError(`Erro ao atualizar contexto de segurança: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [createCurrentSecurityContext, validateSession, logSecurityEvent, state.riskLevel]);

  /**
   * Bloqueia usuário
   */
  const blockUser = useCallback(async (reason: string, duration?: number): Promise<void> => {
    try {
      setState(prev => ({
        ...prev,
        isBlocked: true,
        blockReason: reason,
        isSecure: false,
      }));
      
      await logSecurityEvent('user_blocked', {
        reason,
        duration,
        userId: user?.id,
      });
      
      toast.error(`Acesso bloqueado: ${reason}`);
      
      // Se duração especificada, desbloquear automaticamente
      if (duration) {
        setTimeout(() => {
          unblockUser();
        }, duration);
      }
      
    } catch (err) {
      console.error('Erro ao bloquear usuário:', err);
    }
  }, [logSecurityEvent, user?.id]);

  /**
   * Desbloqueia usuário
   */
  const unblockUser = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({
        ...prev,
        isBlocked: false,
        blockReason: undefined,
        suspiciousActivityCount: 0,
        violations: [],
        riskLevel: 'low',
        isSecure: true,
      }));
      
      violationCountRef.current = 0;
      
      await logSecurityEvent('user_unblocked', {
        userId: user?.id,
      });
      
      toast.success('Acesso restaurado.');
      
    } catch (err) {
      console.error('Erro ao desbloquear usuário:', err);
    }
  }, [logSecurityEvent, user?.id]);

  // =====================================================
  // EFEITOS
  // =====================================================

  /**
   * Inicialização do hook
   */
  useEffect(() => {
    refreshSecurityContext();
  }, [user?.id]);

  /**
   * Validação periódica de sessão
   */
  useEffect(() => {
    if (enableRealTimeMonitoring && sessionValidationInterval > 0) {
      sessionValidationTimerRef.current = setInterval(() => {
        validateSession();
      }, sessionValidationInterval);
      
      return () => {
        if (sessionValidationTimerRef.current) {
          clearInterval(sessionValidationTimerRef.current);
        }
      };
    }
  }, [enableRealTimeMonitoring, sessionValidationInterval, validateSession]);

  /**
   * Limpeza ao desmontar
   */
  useEffect(() => {
    return () => {
      if (sessionValidationTimerRef.current) {
        clearInterval(sessionValidationTimerRef.current);
      }
    };
  }, []);

  // =====================================================
  // RETORNO DO HOOK
  // =====================================================

  const actions: SecurityActions = {
    validateFile,
    checkRateLimit,
    requireEmailVerification,
    logSecurityEvent,
    reportSuspiciousActivity,
    reportSecurityViolation,
    generateSecureNonce,
    handleCSPViolation: handleCSPViolationCallback,
    validateSession,
    refreshSecurityContext,
    blockUser,
    unblockUser,
  };

  return {
    state,
    actions,
    isLoading,
    error,
  };
}

// =====================================================
// HOOKS AUXILIARES
// =====================================================

/**
 * Hook simplificado para validação de arquivos
 */
export function useSecureFileUpload(type: FileUploadType) {
  const { actions } = useSecurity();
  
  return useCallback(async (file: File) => {
    return await actions.validateFile(file, type);
  }, [actions, type]);
}

/**
 * Hook simplificado para rate limiting
 */
export function useSecureAction(action: RateLimitType) {
  const { actions } = useSecurity();
  
  return useCallback(async () => {
    return await actions.checkRateLimit(action);
  }, [actions, action]);
}

/**
 * Hook simplificado para ações críticas
 */
export function useCriticalAction(action: CriticalAction) {
  const { actions } = useSecurity();
  
  return useCallback(async () => {
    const rateLimitOk = await actions.checkRateLimit('API_SENSITIVE');
    if (!rateLimitOk) return false;
    
    const emailVerified = await actions.requireEmailVerification(action);
    if (!emailVerified) return false;
    
    await actions.logSecurityEvent('admin_action', { action });
    return true;
  }, [actions, action]);
}

export default useSecurity;