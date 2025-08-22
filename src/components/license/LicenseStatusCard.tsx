import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Clock, CheckCircle, AlertTriangle, XCircle, MessageCircle } from 'lucide-react';
import { useEnhancedLicenseValidation } from '@/hooks/useEnhancedLicenseValidation';
import { Skeleton } from '@/components/ui/skeleton';

interface LicenseStatusCardProps {
  onSupportClick?: () => void;
}

export const LicenseStatusCard = ({ onSupportClick }: LicenseStatusCardProps) => {
  const { data: license, isLoading } = useEnhancedLicenseValidation();

  const handleWhatsAppSupport = () => {
    const message = encodeURIComponent('Olá! Preciso de ajuda com minha licença do OneDrip.');
    const whatsappUrl = `https://wa.me/556496028022?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5" />
            Status da Licença
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!license?.has_license) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-300">
            <XCircle className="h-5 w-5" />
            Licença Necessária
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant="destructive" className="w-fit">
            Sem Licença
          </Badge>
          <p className="text-sm text-red-600 dark:text-red-400">
            Você precisa de uma licença ativa para usar o sistema.
          </p>
          <Button
            onClick={onSupportClick || handleWhatsAppSupport}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Obter Licença
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!license.is_valid) {
    return (
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-orange-700 dark:text-orange-300">
            <AlertTriangle className="h-5 w-5" />
            Licença Expirada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant="secondary" className="w-fit bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            Expirada
          </Badge>
          <p className="text-sm text-orange-600 dark:text-orange-400">
            {license.message || 'Sua licença expirou e precisa ser renovada.'}
          </p>
          <Button
            onClick={onSupportClick || handleWhatsAppSupport}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Renovar Licença
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Licença válida
  const daysRemaining = license.days_remaining || 0;
  const isExpiringSoon = daysRemaining <= 7;
  const expiresAt = license.expires_at ? new Date(license.expires_at).toLocaleDateString('pt-BR') : 'Indeterminado';

  return (
    <Card className={`border-border ${isExpiringSoon ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950' : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-base ${isExpiringSoon ? 'text-yellow-700 dark:text-yellow-300' : 'text-green-700 dark:text-green-300'}`}>
          {isExpiringSoon ? <Clock className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          Status da Licença
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge 
            variant={isExpiringSoon ? "secondary" : "default"}
            className={`w-fit ${isExpiringSoon ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}
          >
            {isExpiringSoon ? 'Expirando em Breve' : 'Ativa'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {daysRemaining} dias restantes
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Código:</span>
            <span className="font-mono text-xs">
              {license.license_code ? `${license.license_code.slice(0, 6)}***` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expira em:</span>
            <span className="font-medium">{expiresAt}</span>
          </div>
        </div>

        {isExpiringSoon && (
          <Button
            onClick={onSupportClick || handleWhatsAppSupport}
            variant="outline"
            className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Renovar Licença
          </Button>
        )}
      </CardContent>
    </Card>
  );
};