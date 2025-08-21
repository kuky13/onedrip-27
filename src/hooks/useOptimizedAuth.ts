import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { storageManager } from '@/utils/localStorageManager';

export type UserRole = 'admin' | 'manager' | 'user';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  budget_limit?: number;
  advanced_features_enabled: boolean;
}

interface OptimizedAuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: { name: string; role?: string }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  updateEmail: (email: string) => Promise<{ error: any }>;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshProfile: () => Promise<void>;
}

export function useOptimizedAuth(): OptimizedAuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Cache do perfil no storage local
  const cacheProfile = useCallback((profileData: UserProfile) => {
    storageManager.setCache({ profileData });
    storageManager.setUserData({
      id: profileData.id,
      email: user?.email || '',
      name: profileData.name,
      role: profileData.role
    });
  }, [user]);

  // Buscar perfil do usuário com cache
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      // Verificar cache primeiro
      const cachedData = storageManager.getData();
      if (cachedData.cache.profileData && 
          cachedData.cache.expiry && 
          Date.now() < cachedData.cache.expiry) {
        console.log('Usando perfil do cache');
        return cachedData.cache.profileData;
      }

      // Buscar do servidor
      console.log('Buscando perfil do servidor');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }

      if (data) {
        // Garantir que todos os campos necessários estão presentes
        const profileData: UserProfile = {
          id: data.id,
          name: data.name,
          role: data.role as UserRole,
          budget_limit: data.budget_limit,
          advanced_features_enabled: data.advanced_features_enabled
        };
        cacheProfile(profileData);
        return profileData;
      }

      return null;
    } catch (error) {
      console.error('Erro no fetchProfile:', error);
      return null;
    }
  }, [cacheProfile]);

  // Atualizar perfil manualmente
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  // Configurar listeners de autenticação
  useEffect(() => {
    console.log('Configurando listeners de autenticação');
    
    // Migrar dados antigos
    storageManager.migrateOldData();

    let mounted = true;

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      if (!mounted) return;

      try {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Criar backup da sessão
          storageManager.createSessionBackup();
          
          // Buscar perfil
          const profileData = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(profileData);
          }

          // Redirecionamento baseado no evento
          if (event === 'SIGNED_IN') {
            const currentPath = window.location.pathname;
            if (currentPath === '/auth' || currentPath === '/verify' || currentPath === '/reset-password') {
              window.location.href = '/dashboard';
            }
          }
        } else {
          // Limpar dados ao fazer logout
          if (mounted) {
            setProfile(null);
            if (event === 'SIGNED_OUT') {
              storageManager.smartClear();
            }
          }
        }
      } catch (error) {
        console.error('Erro no handleAuthStateChange:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Configurar listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Verificar sessão existente
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          // Tentar recuperar de backup se possível
          if (storageManager.hasValidBackup()) {
            console.log('Tentando recuperar sessão do backup...');
            // Aqui poderíamos implementar lógica de recuperação
          }
        }

        if (mounted) {
          await handleAuthStateChange('INITIAL_SESSION', session);
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Função de login com retry
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message === 'Invalid login credentials' 
            ? "Email ou senha incorretos" 
            : error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando...",
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Erro de conexão",
        description: "Verifique sua conexão e tente novamente",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Outras funções de autenticação
  const signUp = useCallback(async (email: string, password: string, userData: { name: string; role?: string }) => {
    setLoading(true);
    
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
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para ativar a conta",
        });
      }

      return { error };
    } catch (error: any) {
      return { error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      storageManager.fullClear();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada",
        });
      }

      return { error };
    } catch (error: any) {
      return { error };
    }
  }, [toast]);

  const updatePassword = useCallback(async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Senha atualizada!",
          description: "Sua senha foi alterada com sucesso",
        });
      }

      return { error };
    } catch (error: any) {
      return { error };
    }
  }, [toast]);

  const updateEmail = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ email });
      
      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email atualizado!",
          description: "Verifique seu novo email",
        });
      }

      return { error };
    } catch (error: any) {
      return { error };
    }
  }, [toast]);

  // Verificações de role e permissão
  const hasRole = useCallback((role: UserRole): boolean => {
    return profile?.role === role;
  }, [profile]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!profile) return false;
    
    switch (permission) {
      case 'admin':
        return profile.role === 'admin';
      case 'manage_users':
        return ['admin', 'manager'].includes(profile.role);
      case 'advanced_features':
        return profile.advanced_features_enabled;
      default:
        return false;
    }
  }, [profile]);

  // Memoizar valor do contexto
  const value = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
    updateEmail,
    hasRole,
    hasPermission,
    refreshProfile
  }), [
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
    updateEmail,
    hasRole,
    hasPermission,
    refreshProfile
  ]);

  return value;
}