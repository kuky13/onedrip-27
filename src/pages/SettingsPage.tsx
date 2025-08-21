import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SettingsContent } from '@/components/SettingsContent';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

export const SettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isDesktop } = useResponsive();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">Você precisa estar logado para acessar as configurações.</p>
          <Button onClick={() => navigate('/auth')}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen bg-background",
      isDesktop && "desktop-page-content"
    )}>
      {/* Mobile Header */}
      <div className={cn(
        "sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50",
        isDesktop && "desktop-section-header"
      )}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="p-2 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className={cn(
                "text-xl font-bold",
                isDesktop && "desktop-section-title"
              )}>Configurações</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie seu perfil e preferências
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className={cn(
        "pb-24",
        isDesktop && "desktop-grid-container"
      )}>
        <SettingsContent />
      </div>
    </div>
  );
};

export default SettingsPage;