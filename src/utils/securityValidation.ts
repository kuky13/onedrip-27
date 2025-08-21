
import { supabase } from '@/integrations/supabase/client';

/**
 * Utilidades para validação de segurança
 */
export class SecurityValidation {
  /**
   * Verifica se o usuário atual tem email confirmado
   */
  static async isEmailConfirmed(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!(user?.email_confirmed_at);
    } catch {
      return false;
    }
  }

  /**
   * Verifica se o usuário é admin ativo
   */
  static async isActiveAdmin(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_current_user_admin');
      return !error && !!data;
    } catch {
      return false;
    }
  }

  /**
   * Log de auditoria para ações administrativas
   */
  static async logAdminAccess(
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.rpc('log_admin_access', {
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_details: details
      });
    } catch (error) {
      console.warn('Falha ao registrar log de auditoria:', error);
    }
  }

  /**
   * Validação adicional para operações sensíveis
   */
  static async validateSensitiveOperation(): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    // Verificar se usuário está logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { isValid: false, reason: 'Usuário não autenticado' };
    }

    // Verificar se email está confirmado
    if (!user.email_confirmed_at) {
      return { isValid: false, reason: 'Email não confirmado' };
    }

    // Verificar se sessão está válida
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { isValid: false, reason: 'Sessão inválida' };
    }

    return { isValid: true };
  }
}
