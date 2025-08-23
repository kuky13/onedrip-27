import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Building2, ArrowRight, Palette, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { openWhatsApp } from '@/utils/whatsapp';
interface SettingsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  onClick: () => void;
  className?: string;
}
function SettingsCard({
  title,
  description,
  icon,
  badge,
  badgeVariant = 'default',
  onClick,
  className
}: SettingsCardProps) {
  return <Card className={cn('cursor-pointer transition-all duration-300 group', 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]', 'border-2 hover:border-primary/20 bg-card', className)} onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/15 transition-colors">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">
                {title}
              </CardTitle>
              {badge && <Badge variant={badgeVariant} className="mt-2">
                  {badge}
                </Badge>}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </CardDescription>
      </CardContent>
    </Card>;
}
export function ServiceOrderSettings() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // Check if user has VIP access
  const hasVipAccess = profile?.service_orders_vip_enabled || false;
  const settingsOptions = [{
    title: 'Marca da Empresa',
    description: 'Personalize a identidade visual da sua empresa nas ordens compartilhadas. Configure logo, nome e informações de contato.',
    icon: <Building2 className="w-6 h-6 text-purple-600" />,
    badge: 'Recomendado',
    badgeVariant: 'outline' as const,
    path: '/service-orders/settings/branding'
  }];
  const handleNavigation = (path: string) => {
    navigate(path);
  };
  // Check authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">Você precisa estar logado para acessar esta página.</p>
          <Button onClick={() => navigate('/auth')}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  // Check VIP access
  if (!hasVipAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Ordens de Serviço (VIP)</h1>
          <p className="text-muted-foreground mb-6">
            Esta funcionalidade é para usuarios VIP. Entre em contato com o suporte para solicitar acesso.
          </p>
          <Button onClick={() => navigate('/service-orders')} className="w-full">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Settings className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Configurações de Ordens de Serviço
              </h1>
              <p className="text-muted-foreground mt-1">
                Personalize e configure o módulo de ordens de serviço
              </p>
            </div>
          </div>
          
          <Separator className="my-6" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-8">
          
        </div>

        {/* Settings Options */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Opções de Configuração
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settingsOptions.map((option, index) => <SettingsCard key={index} title={option.title} description={option.description} icon={option.icon} badge={option.badge} badgeVariant={option.badgeVariant} onClick={() => handleNavigation(option.path)} className="hover:shadow-lg transition-all duration-300" />)}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          
        </div>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button variant="ghost" onClick={() => navigate('/service-orders')} className="text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar para Ordens de Serviço
          </Button>
        </div>
      </div>
    </div>;
}