import React from 'react';
import { HeartCrack, AlertTriangle, MessageCircle, Key, Calendar, Clock, Shield } from 'lucide-react';
import { useEnhancedLicenseValidation } from '@/hooks/useEnhancedLicenseValidation';
interface DashboardLiteLicenseStatusProps {
  profile: any;
}
export const DashboardLiteLicenseStatus = ({
  profile
}: DashboardLiteLicenseStatusProps) => {
  const {
    data: licenseData,
    isLoading
  } = useEnhancedLicenseValidation();
  if (!profile?.expiration_date) {
    return null;
  }
  const expirationDate = new Date(profile.expiration_date);
  const today = new Date();
  const remainingDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const handleWhatsAppContact = () => {
    const message = encodeURIComponent('Olá! Gostaria de renovar minha licença do sistema.');
    const whatsappUrl = `https://wa.me/5564996028022?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };
  const getStatus = () => {
    if (remainingDays < 0) {
      return {
        title: "Licença Expirada",
        description: `Sua licença expirou. Renove para continuar usando o sistema.`,
        icon: <HeartCrack className="h-6 w-6 text-red-500" />,
        cardClass: "border-red-500/30 bg-red-500/10",
        showRenew: true
      };
    }
    if (remainingDays <= 1) {
      const dayText = remainingDays === 1 ? 'amanhã' : 'hoje';
      return {
        title: `Urgente: Sua licença expira ${dayText}!`,
        description: `Renove para não perder o acesso ao sistema.`,
        icon: <HeartCrack className="h-6 w-6 text-red-500" />,
        cardClass: "border-red-500/50 bg-red-500/20",
        showRenew: true
      };
    }
    if (remainingDays <= 5) {
      return {
        title: "Atenção: Licença Expirando",
        description: `Sua licença expira em ${remainingDays} dias. Renove para não perder o acesso.`,
        icon: <AlertTriangle className="h-6 w-6 text-orange-500" />,
        cardClass: "border-orange-500/30 bg-orange-500/10",
        showRenew: true
      };
    }
    if (remainingDays <= 10) {
      return {
        title: "Atenção: Licença Expirando",
        description: `Sua licença expira em ${remainingDays} dias. Renove para não perder o acesso.`,
        icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
        cardClass: "border-yellow-500/30 bg-yellow-500/10",
        showRenew: true
      };
    }
    return {
      title: "Licença Ativa",
      description: `Sua licença expira em ${remainingDays} dias.`,
      icon: null,
      cardClass: "border-green-500/20 bg-green-500/10",
      showRenew: false
    };
  };
  const status = getStatus();
  return <div className={`bg-card border rounded-lg p-4 mb-4 ${status.cardClass}`}>
      <div className="flex items-center gap-3 mb-3">
        {status.icon}
        <h3 className="text-lg font-semibold text-foreground">
          {status.title}
        </h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        {status.description}
      </p>

      {/* Informações detalhadas da licença */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Expira: {expirationDate.toLocaleDateString('pt-BR')}</span>
          </div>
          
          

          {licenseData?.license_code && <div className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2">
              <Key className="h-4 w-4" />
              <span>Código: {licenseData.license_code}</span>
            </div>}

          {licenseData?.activated_at && <div className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2">
              <Shield className="h-4 w-4" />
              <span>Ativada em: {new Date(licenseData.activated_at).toLocaleDateString('pt-BR')}</span>
            </div>}
        </div>

        {/* Status da validação da licença */}
        {!isLoading && licenseData && <div className="p-3 rounded-md bg-muted/50 border">
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${licenseData.is_valid ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">Status da Licença:</span>
              <span className={licenseData.is_valid ? 'text-green-600' : 'text-red-600'}>
                {licenseData.message}
              </span>
            </div>
          </div>}
      </div>
      
      {status.showRenew && <button onClick={handleWhatsAppContact} className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Renovar via WhatsApp
        </button>}
    </div>;
};