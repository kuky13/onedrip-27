import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedServiceOrderRouteProps {
  children: React.ReactNode;
}

export function ProtectedServiceOrderRoute({ children }: ProtectedServiceOrderRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando autenticação...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Acesso Restrito</h3>
          <p className="text-muted-foreground mb-6">
            Você precisa estar logado para acessar as ordens de serviço.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.href = '/auth'} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Fazer Login
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}