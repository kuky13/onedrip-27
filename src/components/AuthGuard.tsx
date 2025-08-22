
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/pages/AuthPage';
import { LicensePage } from '@/pages/LicensePage';
import { useEnhancedLicenseValidation } from '@/hooks/useEnhancedLicenseValidation';
import { MobileLoading } from '@/components/ui/mobile-loading';
import { SecurityValidation } from '@/utils/securityValidation';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useRef } from 'react';
import { performanceMonitor } from '@/utils/preventReloads';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading, profile, isInitialized } = useAuth();
  const { data: licenseData, isLoading: licenseLoading } = useEnhancedLicenseValidation();
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const renderCountRef = useRef(0);
  
  // Monitor de performance
  useEffect(() => {
    renderCountRef.current++;
    performanceMonitor.recordRender('AuthGuard');
  });

  // Console log apenas durante desenvolvimento e com debounce
  const shouldLog = import.meta.env.DEV && Date.now() % 5000 < 100;
  if (shouldLog) {
    console.log('🛡️ AuthGuard - Estado:', { 
      user: !!user, 
      loading, 
      isInitialized, 
      emailConfirmed: !!user?.email_confirmed_at,
      licenseValid: licenseData?.is_valid,
      licenseLoading
    });
  }

  // Aguardar inicialização completa antes de tomar decisões
  if (loading || !isInitialized) {
    return <MobileLoading message="Inicializando aplicação..." />;
  }

  // Se não há usuário, mostrar página de login
  if (!user) {
    return <AuthPage />;
  }

  // Aguardar validação de licença se ainda estiver carregando
  if (licenseLoading) {
    return <MobileLoading message="Verificando licença..." />;
  }

  // Check if email is verified com validação adicional de segurança
  if (!user.email_confirmed_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-6 bg-card rounded-lg border shadow-sm">
          <h2 className="text-2xl font-bold text-center mb-4">🔒 Confirme seu e-mail</h2>
          <p className="text-muted-foreground text-center mb-4">
            Por segurança, você precisa confirmar seu e-mail antes de acessar o sistema.
            Verifique sua caixa de entrada e clique no link de confirmação.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
            <p className="text-amber-800 text-sm">
              <strong>Medida de Segurança:</strong> Esta verificação protege sua conta e os dados do sistema.
            </p>
          </div>
          <div className="flex justify-center">
            <button 
              onClick={async () => {
                setEmailCheckLoading(true);
                console.log('🔄 Verificando confirmação de email...');
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session?.user?.email_confirmed_at) {
                    console.log('✅ Email confirmado, redirecionando...');
                    window.location.href = '/dashboard';
                  } else {
                    console.log('❌ Email ainda não confirmado');
                  }
                } catch (error) {
                  console.error('❌ Erro ao verificar confirmação:', error);
                } finally {
                  setEmailCheckLoading(false);
                }
              }} 
              disabled={emailCheckLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {emailCheckLoading ? 'Verificando...' : 'Já confirmei'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check license validity after user is authenticated
  if (licenseData && !licenseData.is_valid) {
    return <LicensePage />;
  }

  return <>{children}</>;
};
