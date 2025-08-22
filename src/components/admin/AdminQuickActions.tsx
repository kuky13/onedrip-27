import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, 
  Users, 
  Key, 
  Settings, 
  Download,
  Shield,
  Bell,
  Database,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

type ActiveSection = 'overview' | 'users' | 'licenses' | 'site' | 'tools' | 'settings';

interface AdminQuickActionsProps {
  onSectionChange: (section: ActiveSection) => void;
}

export const AdminQuickActions = ({ onSectionChange }: AdminQuickActionsProps) => {
  const quickActions = [
    {
      id: 'create-user',
      label: 'Criar Usuário',
      icon: UserPlus,
      description: 'Adicionar nova conta',
      type: 'link' as const,
      href: '/signup',
      variant: 'primary' as const
    },
    {
      id: 'view-users',
      label: 'Ver Usuários',
      icon: Users,
      description: 'Lista completa',
      type: 'button' as const,
      onClick: () => onSectionChange('users'),
      variant: 'outline' as const
    },
    {
      id: 'manage-licenses',
      label: 'Licenças',
      icon: Key,
      description: 'Controlar acesso',
      type: 'button' as const,
      onClick: () => onSectionChange('licenses'),
      variant: 'outline' as const
    },
    {
      id: 'system-tools',
      label: 'Ferramentas',
      icon: Settings,
      description: 'Debug e logs',
      type: 'button' as const,
      onClick: () => onSectionChange('tools'),
      variant: 'outline' as const
    }
  ];

  const systemActions = [
    {
      id: 'backup',
      label: 'Backup',
      icon: Database,
      description: 'Criar backup completo'
    },
    {
      id: 'notifications',
      label: 'Notificações',
      icon: Bell,
      description: 'Centro de alertas'
    },
    {
      id: 'security',
      label: 'Segurança',
      icon: Shield,
      description: 'Auditoria e logs'
    },
    {
      id: 'refresh',
      label: 'Atualizar',
      icon: RefreshCw,
      description: 'Recarregar dados'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Ações principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const buttonContent = (
                <div className="w-full h-auto p-4 flex flex-col items-center gap-2 text-center">
                  <action.icon className="h-6 w-6" />
                  <div>
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs opacity-70">{action.description}</div>
                  </div>
                </div>
              );

              if (action.type === 'link') {
                return (
                  <Link key={action.id} to={action.href}>
                    <Button 
                      className={`w-full h-auto p-0 ${
                        action.variant === 'primary'
                          ? 'bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/20 hover:border-primary/30'
                          : ''
                      }`}
                      variant={action.variant === 'primary' ? 'ghost' : 'outline'}
                    >
                      {buttonContent}
                    </Button>
                  </Link>
                );
              }

              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="w-full h-auto p-0"
                  onClick={action.onClick}
                >
                  {buttonContent}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ações do sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Ferramentas do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {systemActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="h-auto p-3 flex flex-col items-center gap-2"
              >
                <action.icon className="h-4 w-4" />
                <div className="text-center">
                  <div className="text-xs font-medium">{action.label}</div>
                  <div className="text-xs opacity-70">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};