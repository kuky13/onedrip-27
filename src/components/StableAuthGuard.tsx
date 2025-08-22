/**
 * AuthGuard Otimizado para Prevenir Recarregamentos
 */

import { useStableAuth } from '@/hooks/useStableAuth';
import { AuthPage } from '@/pages/AuthPage';
import { LicensePage } from '@/pages/LicensePage';
import { useEnhancedLicenseValidation } from '@/hooks/useEnhancedLicenseValidation';
import { MobileLoading } from '@/components/ui/mobile-loading';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo } from 'react';

interface StableAuthGuardProps {
  children: React.ReactNode;
}

export const StableAuthGuard = ({ children }: StableAuthGuardProps) => {
  const { user, loading, isInitialized } = useStableAuth();
  const { data: licenseData, isLoading: licenseLoading } = useEnhancedLicenseValidation();
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);

  // Memoizar estado para evitar re-renderizações
  const authState = useMemo(() => ({
    hasUser: !!user,
    isLoading: loading || !isInitialized,
    emailConfirmed: !!user?.email_confirmed_at,
    licenseValid: licenseData?.is_valid,
    licenseLoading
  }), [user?.id, user?.email_confirmed_at, loading, isInitialized, licenseData?.is_valid, licenseLoading]);

  // Log apenas em desenvolvimento e quando há mudança real
  if (import.meta.env.DEV) {
    console.log('🔒 StableAuth:', authState);
  }

  // Estados de carregamento
  if (authState.isLoading) {
    return <MobileLoading message="Inicializando aplicação..." />;
  }

  if (!authState.hasUser) {
    return <AuthPage />;
  }

  if (authState.licenseLoading) {
    return <MobileLoading message="Verificando licença..." />;
  }

  // Verificação de email
  if (!authState.emailConfirmed) {
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
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session?.user?.email_confirmed_at) {
                    window.location.href = '/dashboard';
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

  // Verificação de licença
  if (licenseData && !authState.licenseValid) {
    return <LicensePage />;
  }

  return <>{children}</>;
};