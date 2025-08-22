/**
 * Hook de Autenticação Segura
 * OneDrip - Implementação com Rate Limiting e Auditoria
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { useRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/utils/security/rateLimiting';
import { validateEmail, validateInput, logSecurityEvent } from '@/utils/security/inputValidation';
import { isHCaptchaEnabled } from '@/utils/hcaptcha';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
  captchaToken?: string;
}

interface SignUpCredentials extends LoginCredentials {
  name?: string;
}

export const useSecureAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false
  });

  const { showError, showSuccess, showWarning } = useToast();
  
  // Rate limiters para diferentes ações
  const loginRateLimit = useRateLimit('login');
  const signupRateLimit = useRateLimit('signup');
  const passwordResetRateLimit = useRateLimit('password_reset');

  // Inicialização segura da autenticação
  useEffect(() => {
    let mounted = true;

    // Listener para mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Log de eventos de autenticação
        if (event === 'SIGNED_IN' && session?.user) {
          logSecurityEvent('USER_LOGIN_SUCCESS', {
            userId: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata?.provider
          });
          
          // Reset rate limits em login bem-sucedido
          loginRateLimit.reset(session.user.email);
        } else if (event === 'SIGNED_OUT') {
          logSecurityEvent('USER_LOGOUT', {});
        }

        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          isAuthenticated: !!session?.user
        });
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (mounted && !error) {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          isAuthenticated: !!session?.user
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Login seguro com rate limiting e hCaptcha
  const signIn = async ({ email, password, captchaToken }: LoginCredentials) => {
    try {
      // Validação de entrada
      const emailValidation = validateEmail(email);
      const passwordValidation = validateInput(password, 'form');

      if (!emailValidation.isValidEmail) {
        showError({
          title: 'Email inválido',
          description: 'Por favor, insira um email válido.'
        });
        return { error: new Error('Email inválido') };
      }

      if (!passwordValidation.isValid) {
        logSecurityEvent('INVALID_LOGIN_INPUT', {
          threats: passwordValidation.threats,
          email: emailValidation.sanitized
        }, 'high');
        showError({
          title: 'Dados inválidos',
          description: 'Dados de login contêm caracteres inválidos.'
        });
        return { error: new Error('Dados inválidos') };
      }

      // Validate captcha token only if hCaptcha is enabled
      const hCaptchaEnabled = isHCaptchaEnabled();
      if (hCaptchaEnabled && !captchaToken) {
        showError({
          title: 'Verificação necessária',
          description: 'Por favor, complete a verificação captcha'
        });
        return { error: new Error('Captcha não verificado') };
      }

      // Verificar hCaptcha se fornecido
      if (captchaToken) {
        // Log da verificação do captcha
        logSecurityEvent('CAPTCHA_VERIFICATION_ATTEMPT', {
          email: emailValidation.sanitized,
          clientId: getClientIdentifier()
        });
      }

      // Verificar rate limiting
      const rateLimitResult = loginRateLimit.checkLimit(emailValidation.sanitized);
      if (!rateLimitResult.allowed) {
        const message = rateLimitResult.retryAfter 
          ? `Muitas tentativas de login. Tente novamente em ${rateLimitResult.retryAfter} segundos.`
          : 'Limite de tentativas excedido.';
        
        logSecurityEvent('LOGIN_RATE_LIMIT_EXCEEDED', {
          email: emailValidation.sanitized,
          attempts: RATE_LIMIT_CONFIGS.login.maxAttempts,
          clientId: getClientIdentifier()
        }, 'high');

        showError({
          title: 'Limite excedido',
          description: message
        });
        return { error: new Error(message) };
      }

      // Tentar autenticar com captcha se fornecido
      const authOptions: any = {
        email: emailValidation.sanitized,
        password: password.trim()
      };

      // Only add captcha token if hCaptcha is enabled
      if (hCaptchaEnabled && captchaToken) {
        authOptions.options = {
          captchaToken
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword(authOptions);

      if (error) {
        // Log de falha na autenticação
        logSecurityEvent('LOGIN_FAILED', {
          email: emailValidation.sanitized,
          error: error.message,
          clientId: getClientIdentifier()
        }, 'medium');

        // Incrementar contador de tentativas falhadas
        loginRateLimit.recordFailure(emailValidation.sanitized);

        // Mapear erros comuns
        let errorMessage = 'Erro no login. Tente novamente.';
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor, confirme seu email antes de fazer login.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
        } else if (error.message.includes('captcha') || error.message.includes('Captcha')) {
          errorMessage = 'Falha na verificação do captcha. Tente novamente.';
          // Log específico para erro de captcha
          logSecurityEvent('CAPTCHA_VERIFICATION_FAILED', {
            email: emailValidation.sanitized,
            error: error.message,
            clientId: getClientIdentifier()
          });
        } else if (error.message.includes('hcaptcha') || error.message.includes('hCaptcha')) {
          errorMessage = 'Erro na verificação hCaptcha. Recarregue a página e tente novamente.';
          // Log específico para erro de hCaptcha
          logSecurityEvent('HCAPTCHA_VERIFICATION_FAILED', {
            email: emailValidation.sanitized,
            error: error.message,
            clientId: getClientIdentifier()
          });
        }

        showError({
          title: 'Erro no login',
          description: errorMessage
        });
        return { error };
      }

      showSuccess({
        title: 'Login realizado',
        description: 'Bem-vindo de volta!'
      });

      return { data, error: null };
    } catch (error) {
      logSecurityEvent('LOGIN_EXCEPTION', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId: getClientIdentifier()
      }, 'high');

      showError({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado. Tente novamente.'
      });
      return { error };
    }
  };

  // Registro seguro
  const signUp = async ({ email, password, name }: SignUpCredentials) => {
    try {
      // Validação de entrada
      const emailValidation = validateEmail(email);
      const passwordValidation = validateInput(password, 'form');
      const nameValidation = name ? validateInput(name, 'form') : { isValid: true, sanitized: '' };

      if (!emailValidation.isValidEmail) {
        showError({
          title: 'Email inválido',
          description: 'Por favor, insira um email válido.'
        });
        return { error: new Error('Email inválido') };
      }

      if (!passwordValidation.isValid || !nameValidation.isValid) {
        const allThreats = [
          ...(passwordValidation as any).threats || [],
          ...(nameValidation as any).threats || []
        ];
        logSecurityEvent('INVALID_SIGNUP_INPUT', {
          threats: allThreats,
          email: emailValidation.sanitized
        }, 'high');
        showError({
          title: 'Dados inválidos',
          description: 'Dados de cadastro contêm caracteres inválidos.'
        });
        return { error: new Error('Dados inválidos') };
      }

      // Rate limiting para signup
      const rateLimitResult = signupRateLimit.checkLimit(emailValidation.sanitized);
      if (!rateLimitResult.allowed) {
        const message = rateLimitResult.retryAfter 
          ? `Muitas tentativas de cadastro. Tente novamente em ${Math.ceil(rateLimitResult.retryAfter / 60)} minutos.`
          : 'Limite de tentativas excedido.';

        logSecurityEvent('SIGNUP_RATE_LIMIT_EXCEEDED', {
          email: emailValidation.sanitized,
          clientId: getClientIdentifier()
        }, 'high');

        showError({
          title: 'Limite excedido',
          description: message
        });
        return { error: new Error(message) };
      }

      // Configurar redirect URL seguro
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: emailValidation.sanitized,
        password: password.trim(),
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: nameValidation.sanitized || emailValidation.sanitized.split('@')[0]
          }
        }
      });

      if (error) {
        logSecurityEvent('SIGNUP_FAILED', {
          email: emailValidation.sanitized,
          error: error.message,
          clientId: getClientIdentifier()
        }, 'medium');

        const errorMessage = error.message.includes('already registered')
          ? 'Este email já está cadastrado. Tente fazer login.'
          : 'Erro no cadastro. Tente novamente.';

        showError({
          title: 'Erro no cadastro',
          description: errorMessage
        });
        return { error };
      }

      logSecurityEvent('SIGNUP_SUCCESS', {
        email: emailValidation.sanitized,
        userId: data.user?.id,
        clientId: getClientIdentifier()
      });

      showSuccess({
        title: 'Cadastro realizado',
        description: 'Verifique seu email para confirmar a conta.'
      });

      return { data, error: null };
    } catch (error) {
      logSecurityEvent('SIGNUP_EXCEPTION', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId: getClientIdentifier()
      }, 'high');

      showError({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado. Tente novamente.'
      });
      return { error };
    }
  };

  // Reset de senha seguro
  const resetPassword = async (email: string) => {
    try {
      const emailValidation = validateEmail(email);
      
      if (!emailValidation.isValidEmail) {
        showError({
          title: 'Email inválido',
          description: 'Por favor, insira um email válido.'
        });
        return { error: new Error('Email inválido') };
      }

      // Rate limiting para reset de senha
      const rateLimitResult = passwordResetRateLimit.checkLimit(emailValidation.sanitized);
      if (!rateLimitResult.allowed) {
        const message = rateLimitResult.retryAfter 
          ? `Muitas tentativas. Tente novamente em ${Math.ceil(rateLimitResult.retryAfter / 60)} minutos.`
          : 'Limite de tentativas excedido.';

        logSecurityEvent('PASSWORD_RESET_RATE_LIMIT_EXCEEDED', {
          email: emailValidation.sanitized,
          clientId: getClientIdentifier()
        }, 'high');

        showError({
          title: 'Limite excedido',
          description: message
        });
        return { error: new Error(message) };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        emailValidation.sanitized,
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      );

      if (error) {
        logSecurityEvent('PASSWORD_RESET_FAILED', {
          email: emailValidation.sanitized,
          error: error.message,
          clientId: getClientIdentifier()
        }, 'medium');

        showError({
          title: 'Erro no reset',
          description: 'Erro ao enviar email de reset. Tente novamente.'
        });
        return { error };
      }

      logSecurityEvent('PASSWORD_RESET_REQUESTED', {
        email: emailValidation.sanitized,
        clientId: getClientIdentifier()
      });

      showSuccess({
        title: 'Email enviado',
        description: 'Verifique seu email para redefinir a senha.'
      });

      return { error: null };
    } catch (error) {
      logSecurityEvent('PASSWORD_RESET_EXCEPTION', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clientId: getClientIdentifier()
      }, 'high');

      showError({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado. Tente novamente.'
      });
      return { error };
    }
  };

  // Logout seguro
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        showError({
          title: 'Erro no logout',
          description: 'Erro ao fazer logout. Tente novamente.'
        });
        return { error };
      }

      showSuccess({
        title: 'Logout realizado',
        description: 'Até logo!'
      });

      return { error: null };
    } catch (error) {
      showError({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado.'
      });
      return { error };
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    // Utilitários de rate limiting
    isLoginBlocked: (email?: string) => loginRateLimit.isBlocked(email),
    isSignupBlocked: (email?: string) => signupRateLimit.isBlocked(email),
    resetLoginLimit: (email?: string) => loginRateLimit.reset(email)
  };
};