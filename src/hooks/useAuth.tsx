import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { getSecureItem } from '@/utils/secureStorage';

export type UserRole = 'admin' | 'manager' | 'user';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  budget_limit: number | null;
  budget_warning_enabled: boolean;
  budget_warning_days: number;
  advanced_features_enabled: boolean;
  service_orders_vip_enabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: { name: string; role?: string }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  updateEmail: (email: string) => Promise<{ error: any }>;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { showSuccess, showError } = useToast();

  // Profile query using React Query
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        return null;
      }
      return data as UserProfile;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  // Gerar fingerprint simples para dispositivo
  const generateDeviceFingerprint = () => {
    const data = {
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform
    };
    return btoa(JSON.stringify(data)).slice(0, 32);
  };

  // Integração com sistema de sessão persistente do Supabase
  const manageSessionPersistence = async (session: Session) => {
    try {
      const deviceFingerprint = generateDeviceFingerprint();
      const { data: sessionData, error } = await supabase.rpc('manage_persistent_session', {
        p_device_fingerprint: deviceFingerprint,
        p_device_name: navigator.platform || 'Unknown Device',
        p_device_type: /Mobile|iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        p_user_agent: navigator.userAgent,
        p_ip_address: null
      });
      
      if (!error && (sessionData as any)?.success) {
        console.log('✅ Sessão persistente configurada');
        
        // Marcar dispositivo como confiável após 3 logins
        const { data: trustData } = await supabase.rpc('trust_device', {
          p_device_fingerprint: deviceFingerprint
        });
        
        if ((trustData as any)?.success) {
          console.log('✅ Dispositivo marcado como confiável');
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao configurar persistência:', error);
    }
  };

  // Inicialização otimizada do auth
  useEffect(() => {
    console.log('🔐 Iniciando AuthProvider...');
    
    const initializeAuth = async () => {
      try {
        console.log('🔍 Verificando sessão existente...');
        
        // DEBUG: Verificar se localStorage tem tokens (apenas em desenvolvimento)
        if (import.meta.env.DEV) {
          const authToken = await getSecureItem('sb-oghjlypdnmqecaavekyr-auth-token');
          console.log('🔑 Token do Supabase existe?', authToken ? 'SIM' : 'NÃO');
          
          if (authToken) {
            try {
              const tokenData = typeof authToken === 'string' ? JSON.parse(authToken) : authToken;
              console.log('📊 Dados do token:', {
                hasAccessToken: !!tokenData?.access_token,
                hasRefreshToken: !!tokenData?.refresh_token,
                expiresAt: tokenData?.expires_at,
                isExpired: tokenData?.expires_at ? new Date(tokenData.expires_at * 1000) < new Date() : 'UNKNOWN'
              });
            } catch (parseError) {
              console.warn('⚠️ Erro ao parsear token:', parseError);
            }
          }
        }
        
        // Primeiro, tentar recuperar a sessão
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão:', error);
          // Se houver erro, tentar refresh da sessão
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('❌ Erro ao fazer refresh da sessão:', refreshError);
            // Limpar dados inválidos
            await supabase.auth.signOut();
          } else if (refreshData.session) {
            console.log('✅ Sessão recuperada via refresh');
            setSession(refreshData.session);
            setUser(refreshData.session.user);
          }
        } else {
          console.log('📋 Resultado getSession:', {
            hasSession: !!session,
            sessionUserId: session?.user?.id,
            sessionExpiresAt: session?.expires_at,
            isExpired: session?.expires_at ? new Date(session.expires_at * 1000) < new Date() : false
          });
          
          // Verificar se a sessão não expirou
          if (session && session.expires_at) {
            const expirationTime = new Date(session.expires_at * 1000);
            const now = new Date();
            
            if (expirationTime <= now) {
              console.log('⏰ Sessão expirada, tentando refresh...');
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) {
                console.error('❌ Erro ao fazer refresh da sessão expirada:', refreshError);
                await supabase.auth.signOut();
              } else if (refreshData.session) {
                console.log('✅ Sessão expirada renovada com sucesso');
                setSession(refreshData.session);
                setUser(refreshData.session.user);
              }
            } else {
              setSession(session);
              setUser(session?.user ?? null);
            }
          } else {
            setSession(session);
            setUser(session?.user ?? null);
          }
        }
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        // Em caso de erro crítico, limpar tudo
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('❌ Erro ao fazer signOut de emergência:', signOutError);
        }
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    // Chamar a inicialização imediatamente
    initializeAuth();

    // Configurar listener de mudanças de autenticação (após a inicialização inicial)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, !!session);
        console.log('🔄 Session details:', session ? {
          access_token: session.access_token ? 'EXISTE' : 'AUSENTE',
          refresh_token: session.refresh_token ? 'EXISTE' : 'AUSENTE',
          expires_at: session.expires_at,
          user_id: session.user?.id,
          isExpired: session.expires_at ? new Date(session.expires_at * 1000) < new Date() : false
        } : 'NENHUMA SESSÃO');
        
        // Verificar se a sessão é válida antes de definir
        if (session && session.expires_at) {
          const expirationTime = new Date(session.expires_at * 1000);
          const now = new Date();
          
          if (expirationTime <= now) {
            console.log('⏰ Sessão recebida já está expirada, ignorando...');
            return;
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);

        // Integrar com sistema persistente apenas em login
        if (event === 'SIGNED_IN' && session) {
          setTimeout(() => {
            manageSessionPersistence(session);
          }, 0);
        }

        // Tratar eventos específicos da página de verificação
        if (window.location.pathname === '/verify') {
          switch (event) {
            case 'PASSWORD_RECOVERY':
              window.location.href = '/reset-password';
              return;
            case 'USER_UPDATED':
              showSuccess({
                title: 'Email atualizado!',
                description: 'Seu endereço de e-mail foi confirmado com sucesso.',
              });
              window.location.href = '/dashboard';
              return;
            case 'SIGNED_IN':
              showSuccess({
                title: 'Conta confirmada!',
                description: 'Bem-vindo! Seu cadastro foi concluído.',
              });
              window.location.href = '/dashboard';
              return;
          }
        }

        // Criar perfil para novos usuários (apenas fora da página de verificação)
        if (event === 'SIGNED_IN' && session?.user && window.location.pathname !== '/verify') {
          console.log('👤 Verificando perfil do usuário...');
          setTimeout(async () => {
            try {
              const { data: existingProfile } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', session.user.id)
                .maybeSingle();

              if (!existingProfile) {
                console.log('📝 Criando novo perfil...');
                await supabase
                  .from('user_profiles')
                  .insert({
                    id: session.user.id,
                    name: session.user.user_metadata?.name || session.user.email || 'Usuário',
                    role: 'user'
                  });
              }
            } catch (error) {
              console.error('❌ Erro ao gerenciar perfil:', error);
            }
          }, 0);
        }

        // Lidar com TOKEN_REFRESHED para manter a sessão ativa
        if (event === 'TOKEN_REFRESHED' && session) {
          if (import.meta.env.DEV) {
            console.log('🔄 Token renovado automaticamente');
          }
        }

        // Lidar com SIGNED_OUT
        if (event === 'SIGNED_OUT') {
          console.log('🚪 Usuário desconectado');
          setSession(null);
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔑 Fazendo login...');
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('❌ Erro no login:', signInError);
        const errorMessage = signInError.message === 'Invalid login credentials' 
          ? 'Email ou senha incorretos'
          : signInError.message;
        
        showError({
          title: 'Erro no login',
          description: errorMessage,
        });
        return { error: signInError };
      }

      if (signInData.user && signInData.session) {
        console.log('✅ Login bem-sucedido');
        
        // Verificar se perfil existe
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', signInData.user.id)
          .maybeSingle();

        if (profileError || !profileData) {
          console.error('❌ Perfil não encontrado');
          await supabase.auth.signOut();
          showError({
            title: 'Erro no login',
            description: 'Perfil de usuário não encontrado. Contate o suporte.',
          });
          return { error: profileError || new Error('Profile not found') };
        }

        showSuccess({
          title: 'Login realizado!',
          description: 'Bem-vindo de volta!'
        });
        
        window.location.href = '/dashboard';
      }
      
      return { error: null };
    } catch (error) {
      console.error('❌ Erro inesperado no login:', error);
      showError({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro durante o login. Tente novamente.'
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: { name: string; role?: string }) => {
    try {
      const redirectUrl = `${window.location.origin}/verify`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: userData.name,
            role: userData.role || 'user'
          }
        }
      });
      
      if (error) {
        const errorMessage = error.message === 'User already registered'
          ? 'Usuário já cadastrado'
          : error.message;
          
        showError({
          title: 'Erro no cadastro',
          description: errorMessage,
        });
      } else {
        showSuccess({
          title: 'Cadastro realizado!',
          description: 'Verifique seu email para confirmar a conta.',
          duration: 6000
        });
      }
      
      return { error };
    } catch (error) {
      showError({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro durante o cadastro. Tente novamente.'
      });
      return { error };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/verify`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        showError({
          title: 'Erro ao solicitar',
          description: "Não foi possível enviar o link. Verifique o e-mail e tente novamente.",
        });
      } else {
        showSuccess({
          title: 'Link enviado!',
          description: 'Se o e-mail estiver cadastrado, um link de redefinição foi enviado.',
        });
      }
      return { error };
    } catch (error) {
      showError({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao solicitar a redefinição. Tente novamente.',
      });
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        showError({
          title: 'Erro ao atualizar senha',
          description: error.message,
        });
      } else {
        showSuccess({
          title: 'Senha atualizada!',
          description: 'Sua senha foi alterada com sucesso.',
        });
      }
      return { error };
    } catch (error) {
      showError({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao atualizar sua senha. Tente novamente.',
      });
      return { error };
    }
  };

  const updateEmail = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/verify`;
      const { error } = await supabase.auth.updateUser(
        { email },
        { emailRedirectTo: redirectUrl }
      );

      if (error) {
        const errorMessage = error.message === 'New email address should be different from the current one.'
          ? 'O novo email deve ser diferente do atual.'
          : error.message;
        showError({
          title: 'Erro ao atualizar email',
          description: errorMessage,
        });
      } else {
        showSuccess({
          title: 'Confirmação enviada!',
          description: 'Verifique seu novo email para confirmar a alteração.',
        });
      }
      return { error };
    } catch (error) {
      showError({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao atualizar seu email. Tente novamente.',
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      console.log('✅ Logout realizado com sucesso');
      window.location.href = '/auth';
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      showError({
        title: 'Erro no logout',
        description: 'Ocorreu um erro ao desconectar. Tente novamente.'
      });
    }
  };

  const hasRole = (role: UserRole): boolean => {
    if (!profile) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      manager: 2,
      admin: 3,
    };
    
    return roleHierarchy[profile.role] >= roleHierarchy[role];
  };

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;
    
    const permissions: Record<UserRole, string[]> = {
      user: ['view_own_budgets', 'create_budgets', 'edit_own_budgets'],
      manager: ['view_all_budgets', 'manage_clients', 'view_reports'],
      admin: ['manage_users', 'manage_system', 'view_analytics'],
    };
    
    const userPermissions: string[] = [];
    Object.entries(permissions).forEach(([role, perms]) => {
      if (hasRole(role as UserRole)) {
        userPermissions.push(...perms);
      }
    });
    
    return userPermissions.includes(permission);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    isInitialized,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
    updateEmail,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};