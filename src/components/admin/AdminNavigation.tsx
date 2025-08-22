import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Shield, 
  Settings, 
  Globe, 
  Key, 
  Image, 
  Gamepad2,
  BarChart3,
  Database,
  Bell,
  AlertTriangle,
  Activity,
  Monitor,
  FileText,
  Zap,
  Lock,
  ChevronRight
} from 'lucide-react';

type ActiveSection = 'overview' | 'users' | 'licenses' | 'site' | 'tools' | 'notifications' | 'settings';

interface AdminNavigationProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
}

export const AdminNavigation = ({ activeSection, onSectionChange }: AdminNavigationProps) => {
  const navigationItems = [
    {
      id: 'overview' as ActiveSection,
      label: 'Visão Geral',
      icon: Monitor,
      description: 'Dashboard e estatísticas',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      count: null
    },
    {
      id: 'users' as ActiveSection,
      label: 'Usuários',
      icon: Users,
      description: 'Gerenciar contas',
      color: 'bg-green-500/10 text-green-600 dark:text-green-400',
      count: 147
    },
    {
      id: 'licenses' as ActiveSection,
      label: 'Licenças',
      icon: Key,
      description: 'Controle de assinaturas',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      count: 128
    },
    {
      id: 'site' as ActiveSection,
      label: 'Site',
      icon: Globe,
      description: 'Configurações gerais',
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      count: null
    },
    {
      id: 'notifications' as ActiveSection,
      label: 'Notificações',
      icon: Bell,
      description: 'Enviar mensagens',
      color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      count: null
    },
    {
      id: 'tools' as ActiveSection,
      label: 'Ferramentas',
      icon: Settings,
      description: 'Debug e manutenção',
      color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
      count: null
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {navigationItems.map((item) => (
        <Button
          key={item.id}
          variant={activeSection === item.id ? "default" : "ghost"}
          className={`h-auto p-4 flex flex-col items-center gap-3 text-left transition-all duration-200 hover:scale-105 ${
            activeSection === item.id 
              ? 'bg-primary text-primary-foreground shadow-lg border-2 border-primary/20' 
              : 'hover:bg-muted border-2 border-transparent hover:border-muted-foreground/20'
          }`}
          onClick={() => onSectionChange(item.id)}
        >
          <div className="flex items-center justify-between w-full">
            <div className={`p-3 rounded-xl transition-colors ${
              activeSection === item.id 
                ? 'bg-primary-foreground/20' 
                : item.color
            }`}>
              <item.icon className="h-6 w-6" />
            </div>
            
            {item.count && (
              <Badge 
                variant={activeSection === item.id ? "secondary" : "outline"}
                className="text-xs"
              >
                {item.count}
              </Badge>
            )}
          </div>
          
          <div className="space-y-1 text-center w-full">
            <div className="font-medium flex items-center justify-center gap-1">
              {item.label}
              {activeSection === item.id && (
                <ChevronRight className="h-3 w-3 opacity-70" />
              )}
            </div>
            <div className={`text-xs ${
              activeSection === item.id 
                ? 'text-primary-foreground/70' 
                : 'text-muted-foreground'
            }`}>
              {item.description}
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
};