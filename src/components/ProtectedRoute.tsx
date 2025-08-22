
import React from 'react';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { EmptyState } from '@/components/EmptyState';
import { Shield, User } from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/loading-states';
import { useLicenseValidation } from '@/hooks/useLicenseValidation';
import { useNavigate } from 'react-router-dom';
import { safeRedirect } from '@/utils/secureNavigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  requiredPermission,
  fallback 
}: ProtectedRouteProps) => {
  const { user, profile, loading, hasRole, hasPermission } = useAuth();
  const { data: isLicenseValid, isLoading: licenseLoading } = useLicenseValidation();
  const navigate = useNavigate();

  if (loading || licenseLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return fallback || (
      <EmptyState
        icon={User}
        title="Acesso Negado"
        description="Você precisa estar logado para acessar esta página."
        action={{
          label: "Fazer Login",
          onClick: () => safeRedirect('/auth')
        }}
      />
    );
  }

  // Check if email is verified
  if (!user.email_confirmed_at) {
    return (
      <EmptyState
        icon={User}
        title="E-mail não verificado"
        description="Por favor, verifique seu e-mail antes de continuar."
      />
    );
  }

  if (!profile) {
    return (
      <EmptyState
        icon={User}
        title="Perfil Não Encontrado"
        description="Seu perfil não foi encontrado no sistema. Entre em contato com o administrador."
      />
    );
  }

  // Check license validity
  if (isLicenseValid === false) {
    navigate('/licenca');
    return null;
  }

  // Explicit role checking for admin routes
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <EmptyState
        icon={Shield}
        title="Permissão Insuficiente"
        description={`Você precisa ter o nível de acesso "${requiredRole}" ou superior para acessar esta página.`}
        action={{
          label: "Voltar ao Dashboard",
          onClick: () => safeRedirect('/dashboard')
        }}
      />
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <EmptyState
        icon={Shield}
        title="Permissão Negada"
        description="Você não tem permissão para acessar esta funcionalidade."
        action={{
          label: "Voltar ao Dashboard",
          onClick: () => window.location.href = '/dashboard'
        }}
      />
    );
  }

  return <>{children}</>;
};
