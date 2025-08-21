/**
 * SISTEMA DE VALIDAÇÃO DE E-MAIL OBRIGATÓRIA
 * Garante que usuários tenham e-mail verificado antes de ações críticas
 * Implementa múltiplas camadas de verificação e segurança
 */

import { supabase } from '@/integrations/supabase/client';
import { securityLogger, SecurityEventType } from './securityAuditLogger';

export interface EmailVerificationStatus {
  isVerified: boolean;
  lastVerificationDate?: string;
  verificationMethod?: 'email_link' | 'otp' | 'admin_override';
  pendingVerification?: boolean;
  blockedActions?: string[];
}

export interface CriticalAction {
  action: string;
  resourceType?: string;
  resourceId?: string;
  requiresRecentVerification?: boolean;
  maxVerificationAge?: number; // em horas
}

// Ações que requerem e-mail verificado
export const CRITICAL_ACTIONS = {
  // Financeiro
  CREATE_BUDGET: { action: 'create_budget', requiresRecentVerification: false },
  APPROVE_BUDGET: { action: 'approve_budget', requiresRecentVerification: true, maxVerificationAge: 24 },
  PROCESS_PAYMENT: { action: 'process_payment', requiresRecentVerification: true, maxVerificationAge: 1 },
  
  // Dados sensíveis
  EXPORT_DATA: { action: 'export_data', requiresRecentVerification: true, maxVerificationAge: 1 },
  DELETE_ACCOUNT: { action: 'delete_account', requiresRecentVerification: true, maxVerificationAge: 1 },
  CHANGE_EMAIL: { action: 'change_email', requiresRecentVerification: true, maxVerificationAge: 1 },
  CHANGE_PASSWORD: { action: 'change_password', requiresRecentVerification: true, maxVerificationAge: 24 },
  
  // Administração
  MANAGE_USERS: { action: 'manage_users', requiresRecentVerification: true, maxVerificationAge: 24 },
  CHANGE_PERMISSIONS: { action: 'change_permissions', requiresRecentVerification: true, maxVerificationAge: 1 },
  ACCESS_ADMIN_PANEL: { action: 'access_admin_panel', requiresRecentVerification: true, maxVerificationAge: 24 },
  
  // Configurações críticas
  CHANGE_COMPANY_SETTINGS: { action: 'change_company_settings', requiresRecentVerification: true, maxVerificationAge: 24 },
  MANAGE_INTEGRATIONS: { action: 'manage_integrations', requiresRecentVerification: true, maxVerificationAge: 24 },
  
  // Uploads sensíveis
  UPLOAD_SENSITIVE_DOCUMENT: { action: 'upload_sensitive_document', requiresRecentVerification: false },
  
  // Ordens de serviço críticas
  APPROVE_HIGH_VALUE_ORDER: { action: 'approve_high_value_order', requiresRecentVerification: true, maxVerificationAge: 24 },
  CANCEL_ORDER: { action: 'cancel_order', requiresRecentVerification: false },
  
  // LGPD/GDPR
  REQUEST_DATA_DELETION: { action: 'request_data_deletion', requiresRecentVerification: true, maxVerificationAge: 1 },
  DOWNLOAD_PERSONAL_DATA: { action: 'download_personal_data', requiresRecentVerification: true, maxVerificationAge: 1 }
} as const;

class EmailVerificationGuard {
  private static instance: EmailVerificationGuard;
  private verificationCache = new Map<string, EmailVerificationStatus>();
  private pendingVerifications = new Set<string>();

  private constructor() {}

  public static getInstance(): EmailVerificationGuard {
    if (!EmailVerificationGuard.instance) {
      EmailVerificationGuard.instance = new EmailVerificationGuard();
    }
    return EmailVerificationGuard.instance;
  }

  /**
   * Verifica se o usuário pode executar uma ação crítica
   */
  public async canPerformAction(
    userId: string, 
    action: CriticalAction
  ): Promise<{ allowed: boolean; reason?: string; requiresVerification?: boolean }> {
    try {
      // Obter status de verificação do usuário
      const verificationStatus = await this.getVerificationStatus(userId);
      
      // Se e-mail não está verificado
      if (!verificationStatus.isVerified) {
        securityLogger.logUnauthorizedAccess(
          action.resourceType || 'unknown',
          `${action.action}_without_email_verification`
        );
        
        return {
          allowed: false,
          reason: 'E-mail não verificado. Verifique seu e-mail antes de continuar.',
          requiresVerification: true
        };
      }

      // Se requer verificação recente
      if (action.requiresRecentVerification && action.maxVerificationAge) {
        const isRecentlyVerified = await this.isRecentlyVerified(
          userId, 
          action.maxVerificationAge
        );
        
        if (!isRecentlyVerified) {
          securityLogger.logUnauthorizedAccess(
            action.resourceType || 'unknown',
            `${action.action}_without_recent_verification`
          );
          
          return {
            allowed: false,
            reason: `Esta ação requer verificação de e-mail recente (últimas ${action.maxVerificationAge} horas).`,
            requiresVerification: true
          };
        }
      }

      // Log da ação autorizada
      securityLogger.logDataAccess(
        action.resourceType || 'action',
        action.resourceId || action.action,
        `${action.action}_authorized`
      );

      return { allowed: true };
      
    } catch (error) {
      console.error('Erro ao verificar permissão de ação:', error);
      
      securityLogger.logSecurityEvent({
        event_type: SecurityEventType.SECURITY_VIOLATION,
        action: 'email_verification_check_failed',
        details: {
          user_id: userId,
          attempted_action: action.action,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        risk_level: 'high'
      });
      
      return {
        allowed: false,
        reason: 'Erro interno na verificação de segurança. Tente novamente.'
      };
    }
  }

  /**
   * Obtém o status de verificação do usuário
   */
  public async getVerificationStatus(userId: string): Promise<EmailVerificationStatus> {
    // Verificar cache primeiro
    const cached = this.verificationCache.get(userId);
    if (cached) {
      return cached;
    }

    try {
      // Buscar do Supabase
      const { data: user, error } = await supabase.auth.getUser();
      
      if (error || !user.user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se e-mail está confirmado
      const isVerified = !!user.user.email_confirmed_at;
      
      // Buscar informações adicionais de verificação
      const { data: verificationData } = await supabase
        .from('user_email_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('verified_at', { ascending: false })
        .limit(1)
        .single();

      const status: EmailVerificationStatus = {
        isVerified,
        lastVerificationDate: user.user.email_confirmed_at || verificationData?.verified_at,
        verificationMethod: verificationData?.method || 'email_link',
        pendingVerification: this.pendingVerifications.has(userId)
      };

      // Cache por 5 minutos
      this.verificationCache.set(userId, status);
      setTimeout(() => this.verificationCache.delete(userId), 5 * 60 * 1000);

      return status;
      
    } catch (error) {
      console.error('Erro ao obter status de verificação:', error);
      return {
        isVerified: false,
        pendingVerification: false
      };
    }
  }

  /**
   * Verifica se o e-mail foi verificado recentemente
   */
  private async isRecentlyVerified(userId: string, maxAgeHours: number): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('user_email_verifications')
        .select('verified_at')
        .eq('user_id', userId)
        .gte('verified_at', new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString())
        .order('verified_at', { ascending: false })
        .limit(1);

      return data && data.length > 0;
      
    } catch (error) {
      console.error('Erro ao verificar verificação recente:', error);
      return false;
    }
  }

  /**
   * Envia e-mail de verificação
   */
  public async sendVerificationEmail(userId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user?.email) {
        return {
          success: false,
          message: 'E-mail do usuário não encontrado'
        };
      }

      // Verificar rate limiting
      const canSend = await this.checkVerificationRateLimit(user.user.id);
      if (!canSend) {
        return {
          success: false,
          message: 'Muitas tentativas de verificação. Aguarde antes de tentar novamente.'
        };
      }

      // Marcar como pendente
      this.pendingVerifications.add(user.user.id);

      // Enviar e-mail de verificação
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.user.email
      });

      if (error) {
        this.pendingVerifications.delete(user.user.id);
        throw error;
      }

      // Log do envio
      securityLogger.logSecurityEvent({
        event_type: SecurityEventType.EMAIL_CHANGE,
        action: 'verification_email_sent',
        details: {
          email: user.user.email,
          user_id: user.user.id
        },
        risk_level: 'low'
      });

      // Registrar tentativa de verificação
      await supabase
        .from('user_verification_attempts')
        .insert({
          user_id: user.user.id,
          email: user.user.email,
          attempt_type: 'email_verification',
          attempted_at: new Date().toISOString()
        });

      return {
        success: true,
        message: 'E-mail de verificação enviado com sucesso'
      };
      
    } catch (error) {
      console.error('Erro ao enviar e-mail de verificação:', error);
      
      securityLogger.logSecurityEvent({
        event_type: SecurityEventType.SECURITY_VIOLATION,
        action: 'verification_email_send_failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        risk_level: 'medium'
      });
      
      return {
        success: false,
        message: 'Erro ao enviar e-mail de verificação. Tente novamente.'
      };
    }
  }

  /**
   * Verifica rate limiting para envio de e-mails de verificação
   */
  private async checkVerificationRateLimit(userId: string): Promise<boolean> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('user_verification_attempts')
        .select('id')
        .eq('user_id', userId)
        .eq('attempt_type', 'email_verification')
        .gte('attempted_at', oneHourAgo);

      if (error) {
        console.error('Erro ao verificar rate limit:', error);
        return true; // Em caso de erro, permitir
      }

      const attemptCount = data?.length || 0;
      const maxAttempts = 3; // Máximo 3 tentativas por hora

      if (attemptCount >= maxAttempts) {
        securityLogger.logRateLimitExceeded('email_verification', maxAttempts);
        return false;
      }

      return true;
      
    } catch (error) {
      console.error('Erro ao verificar rate limit:', error);
      return true; // Em caso de erro, permitir
    }
  }

  /**
   * Marca verificação como concluída
   */
  public async markVerificationComplete(userId: string, method: 'email_link' | 'otp' | 'admin_override'): Promise<void> {
    try {
      // Remover da lista de pendentes
      this.pendingVerifications.delete(userId);
      
      // Limpar cache
      this.verificationCache.delete(userId);
      
      // Registrar verificação
      await supabase
        .from('user_email_verifications')
        .insert({
          user_id: userId,
          method,
          verified_at: new Date().toISOString()
        });

      // Log da verificação
      securityLogger.logSecurityEvent({
        event_type: SecurityEventType.EMAIL_CHANGE,
        action: 'email_verification_completed',
        details: {
          user_id: userId,
          method,
          verified_at: new Date().toISOString()
        },
        risk_level: 'low'
      });
      
    } catch (error) {
      console.error('Erro ao marcar verificação como concluída:', error);
    }
  }

  /**
   * Obtém lista de ações bloqueadas para usuário não verificado
   */
  public getBlockedActions(): string[] {
    return Object.values(CRITICAL_ACTIONS).map(action => action.action);
  }

  /**
   * Limpa cache de verificação
   */
  public clearCache(userId?: string): void {
    if (userId) {
      this.verificationCache.delete(userId);
    } else {
      this.verificationCache.clear();
    }
  }
}

// Instância singleton
export const emailVerificationGuard = EmailVerificationGuard.getInstance();

// Hook para React
export function useEmailVerification() {
  const checkAction = async (action: keyof typeof CRITICAL_ACTIONS, resourceId?: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { allowed: false, reason: 'Usuário não autenticado' };
    }

    const actionConfig = CRITICAL_ACTIONS[action];
    return emailVerificationGuard.canPerformAction(user.user.id, {
      ...actionConfig,
      resourceId
    });
  };

  const getStatus = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;
    
    return emailVerificationGuard.getVerificationStatus(user.user.id);
  };

  const sendVerification = () => {
    return emailVerificationGuard.sendVerificationEmail();
  };

  return {
    checkAction,
    getStatus,
    sendVerification,
    blockedActions: emailVerificationGuard.getBlockedActions()
  };
}

// Componente de verificação de e-mail
export interface EmailVerificationPromptProps {
  action: string;
  onVerified?: () => void;
  onCancel?: () => void;
}

// Middleware para verificação automática
export function withEmailVerification<T extends (...args: any[]) => any>(
  action: keyof typeof CRITICAL_ACTIONS,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const actionConfig = CRITICAL_ACTIONS[action];
    const result = await emailVerificationGuard.canPerformAction(user.user.id, actionConfig);
    
    if (!result.allowed) {
      throw new Error(result.reason || 'Ação não permitida');
    }

    return fn(...args);
  }) as T;
}

// Decorator para métodos de classe
export function RequireEmailVerification(action: keyof typeof CRITICAL_ACTIONS) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      const actionConfig = CRITICAL_ACTIONS[action];
      const result = await emailVerificationGuard.canPerformAction(user.user.id, actionConfig);
      
      if (!result.allowed) {
        throw new Error(result.reason || 'Ação não permitida');
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}