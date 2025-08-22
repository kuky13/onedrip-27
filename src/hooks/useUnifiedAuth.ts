import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SecurityValidation } from '@/utils/securityValidation';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials extends LoginCredentials {
  name?: string;
}

interface AuthResponse {
  success: boolean;
  error?: string;
}

/**
 * Hook unificado de autenticação com validação de segurança integrada
 * Substitui useAuth e useSecureAuth com melhor performance e segurança
 */
export const useUnifiedAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    isInitialized: false,
  });

  // Estados para rate limiting
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [signupAttempts, setSignupAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);

  const MAX_ATTEMPTS = 5;
  const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos

  // Função para verificar rate limiting
  const checkRateLimit = useCallback((type: 'login' | 'signup'): boolean => {
    const now = Date.now();
    const attempts = type === 'login' ? loginAttempts : signupAttempts;
    
    if (now - lastAttemptTime > RATE_LIMIT_WINDOW) {
      // Reset counter após janela de tempo
      setLoginAttempts(0);
      setSignupAttempts(0);
      setLastAttemptTime(now);
      return true;
    }
    
    return attempts < MAX_ATTEMPTS;
  }, [loginAttempts, signupAttempts, lastAttemptTime]);

  // Função para incrementar tentativas
  const incrementAttempts = useCallback((type: 'login' | 'signup') => {
    setLastAttemptTime(Date.now());
    if (type === 'login') {
      setLoginAttempts(prev => prev + 1);
    } else {
      setSignupAttempts(prev => prev + 1);
    }
  }, []);

  // Função para logs de auditoria de segurança
  const logSecurityEvent = useCallback(async (
    eventType: string,
    success: boolean,
    details?: Record<string, any>
  ) => {
    try {
      await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_user_id: authState.user?.id || null,
        p_details: {
          success,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ...details
        },
        p_severity: success ? 'low' : 'medium'
      });
    } catch (error) {
      console.warn('Falha ao registrar evento de segurança:', error);
    }
  }, [authState.user?.id]);

  // Função de login seguro
  const signIn = useCallback(async ({ email, password }: LoginCredentials): Promise<AuthResponse> => {
    // Verificar rate limiting
    if (!checkRateLimit('login')) {
      await logSecurityEvent('LOGIN_RATE_LIMITED', false, { email });
      return {
        success: false,
        error: `Muitas tentativas de login. Tente novamente em ${Math.ceil(RATE_LIMIT_WINDOW / 60000)} minutos.`
      };
    }

    // Validar inputs
    if (!email || !password) {
      incrementAttempts('login');
      return { success: false, error: 'Email e senha são obrigatórios' };
    }

    try {
      // Verificar validação adicional de segurança
      const validation = await SecurityValidation.validateSensitiveOperation();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        incrementAttempts('login');
        await logSecurityEvent('LOGIN_FAILED', false, { 
          email, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }

      // Reset tentativas em caso de sucesso
      setLoginAttempts(0);
      await logSecurityEvent('LOGIN_SUCCESS', true, { email });
      
      return { success: true };
    } catch (error: any) {
      incrementAttempts('login');
      await logSecurityEvent('LOGIN_ERROR', false, { 
        email, 
        error: error.message 
      });
      return { success: false, error: 'Erro interno durante login' };
    }
  }, [checkRateLimit, incrementAttempts, logSecurityEvent]);

  // Função de registro seguro
  const signUp = useCallback(async ({ email, password, name }: SignUpCredentials): Promise<AuthResponse> => {
    // Verificar rate limiting
    if (!checkRateLimit('signup')) {
      await logSecurityEvent('SIGNUP_RATE_LIMITED', false, { email });
      return {
        success: false,
        error: `Muitas tentativas de registro. Tente novamente em ${Math.ceil(RATE_LIMIT_WINDOW / 60000)} minutos.`
      };
    }

    // Validar inputs
    if (!email || !password) {
      incrementAttempts('signup');
      return { success: false, error: 'Email e senha são obrigatórios' };
    }

    if (password.length < 8) {
      incrementAttempts('signup');
      return { success: false, error: 'Senha deve ter pelo menos 8 caracteres' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name || 'Usuário'
          }
        }
      });

      if (error) {
        incrementAttempts('signup');
        await logSecurityEvent('SIGNUP_FAILED', false, { 
          email, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }

      // Reset tentativas em caso de sucesso
      setSignupAttempts(0);
      await logSecurityEvent('SIGNUP_SUCCESS', true, { email });
      
      return { success: true };
    } catch (error: any) {
      incrementAttempts('signup');
      await logSecurityEvent('SIGNUP_ERROR', false, { 
        email, 
        error: error.message 
      });
      return { success: false, error: 'Erro interno durante registro' };
    }
  }, [checkRateLimit, incrementAttempts, logSecurityEvent]);

  // Função de logout seguro
  const signOut = useCallback(async (): Promise<AuthResponse> => {
    try {
      await logSecurityEvent('LOGOUT_ATTEMPT', true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        await logSecurityEvent('LOGOUT_FAILED', false, { error: error.message });
        return { success: false, error: error.message };
      }

      await logSecurityEvent('LOGOUT_SUCCESS', true);
      return { success: true };
    } catch (error: any) {
      await logSecurityEvent('LOGOUT_ERROR', false, { error: error.message });
      return { success: false, error: 'Erro durante logout' };
    }
  }, [logSecurityEvent]);

  // Função de reset de senha seguro
  const resetPassword = useCallback(async (email: string): Promise<AuthResponse> => {
    if (!email) {
      return { success: false, error: 'Email é obrigatório' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        await logSecurityEvent('PASSWORD_RESET_FAILED', false, { 
          email, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }

      await logSecurityEvent('PASSWORD_RESET_REQUEST', true, { email });
      return { success: true };
    } catch (error: any) {
      await logSecurityEvent('PASSWORD_RESET_ERROR', false, { 
        email, 
        error: error.message 
      });
      return { success: false, error: 'Erro ao solicitar reset de senha' };
    }
  }, [logSecurityEvent]);

  // Inicialização do auth
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Inicializando UnifiedAuth...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão:', error);
        } else {
          setAuthState(prev => ({
            ...prev,
            session,
            user: session?.user ?? null,
            isAuthenticated: !!session,
          }));
        }
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
      } finally {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          isInitialized: true
        }));
      }
    };

    initializeAuth();

    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, !!session);
        
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
        }));

        // Log eventos de autenticação
        if (event === 'SIGNED_IN' && session) {
          setTimeout(() => {
            logSecurityEvent('SESSION_ESTABLISHED', true, {
              user_id: session.user.id
            });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setTimeout(() => {
            logSecurityEvent('SESSION_TERMINATED', true);
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [logSecurityEvent]);

  // Função para verificar se é admin
  const isAdmin = useCallback(async (): Promise<boolean> => {
    if (!authState.user) return false;
    
    try {
      const { data, error } = await supabase.rpc('is_current_user_admin');
      return !error && !!data;
    } catch {
      return false;
    }
  }, [authState.user]);

  // Função para verificar se email está confirmado
  const isEmailConfirmed = useCallback((): boolean => {
    return !!(authState.user?.email_confirmed_at);
  }, [authState.user]);

  return {
    // Estados
    ...authState,
    
    // Funções de autenticação
    signIn,
    signUp,
    signOut,
    resetPassword,
    
    // Utilidades
    isAdmin,
    isEmailConfirmed,
    
    // Rate limiting status
    isLoginBlocked: !checkRateLimit('login'),
    isSignupBlocked: !checkRateLimit('signup'),
    loginAttemptsRemaining: Math.max(0, MAX_ATTEMPTS - loginAttempts),
    signupAttemptsRemaining: Math.max(0, MAX_ATTEMPTS - signupAttempts),
  };
};