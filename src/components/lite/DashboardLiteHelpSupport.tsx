import React, { useState } from 'react';
import { LifeBuoy, MessageCircle, Sparkles, BookOpen, Video, HelpCircle, ArrowRight, Calendar, RefreshCw, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { openWhatsApp } from '@/utils/whatsappUtils';
import { useNavigate } from 'react-router-dom';

import { useUserLicenseDetails } from '@/hooks/useUserLicenseDetails';

export const DashboardLiteHelpSupport = () => {
  const [showLicenseCode, setShowLicenseCode] = useState(false);
  const { licenseDetails, loading, error } = useUserLicenseDetails();
  const navigate = useNavigate();
  
  const handleWhatsAppSupport = () => {
    openWhatsApp('https://wa.me/556496028022');
  };

  const handleRenewLicense = () => {
    const message = 'Olá! Gostaria de renovar minha licença do sistema OneDrip.';
    openWhatsApp(`https://wa.me/556496028022?text=${encodeURIComponent(message)}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getLicenseStatusColor = () => {
    if (!licenseDetails?.is_valid) return 'text-red-500';
    if (licenseDetails.days_remaining && licenseDetails.days_remaining <= 7) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getLicenseStatusIcon = () => {
    if (!licenseDetails?.is_valid) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (licenseDetails.days_remaining && licenseDetails.days_remaining <= 7) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };
  const handleHelpClick = () => {
    navigate('/central-de-ajuda');
  };
  return <>
      <div className="space-y-4">
        {/* Status da Licença */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Status da Licença
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Carregando...</span>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            ) : licenseDetails ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {getLicenseStatusIcon()}
                  <span className={`font-medium ${getLicenseStatusColor()}`}>
                    {licenseDetails.is_valid ? 'Licença Ativa' : 'Licença Inválida'}
                  </span>
                </div>
                
                {licenseDetails.is_valid && licenseDetails.days_remaining !== undefined && (
                  <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Dias restantes:</span>
                      <span className={`font-bold ${getLicenseStatusColor()}`}>
                        {licenseDetails.days_remaining} dias
                      </span>
                    </div>
                    {licenseDetails.expires_at && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-muted-foreground text-xs">Expira em:</span>
                        <span className="text-card-foreground text-xs">
                          {formatDate(licenseDetails.expires_at)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {licenseDetails.license_code && (
                  <div className="bg-muted/30 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-xs text-muted-foreground">Código: </span>
                        <span className="text-xs font-mono text-card-foreground">
                          {showLicenseCode ? licenseDetails.license_code : '••••••••••••'}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowLicenseCode(!showLicenseCode)}
                        className="ml-2 p-1 hover:bg-muted/50 rounded transition-colors"
                        title={showLicenseCode ? 'Ocultar código' : 'Mostrar código'}
                      >
                        {showLicenseCode ? (
                          <EyeOff className="h-3 w-3 text-primary" />
                        ) : (
                          <Eye className="h-3 w-3 text-primary" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <Button 
                    onClick={handleRenewLicense}
                    className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    style={{
                      touchAction: 'manipulation'
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Renovar
                  </Button>
                  
                  <Button 
                    onClick={handleHelpClick} 
                    variant="outline" 
                    className="w-full bg-muted/30 hover:bg-muted/50 active:bg-muted/70 border-border text-primary py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    style={{
                      touchAction: 'manipulation'
                    }}
                  >
                    <LifeBuoy className="h-4 w-4" />
                    Ajuda
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-gray-600 text-sm mb-3">Nenhuma licença encontrada</p>
                <Button 
                  onClick={handleRenewLicense}
                  className="w-full bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  style={{
                    touchAction: 'manipulation'
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Solicitar Licença
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ajuda Rápida */}
        

        {/* Dicas Rápidas */}
        <Card className="border-dashed border-muted-foreground/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
              <h4 className="text-sm font-medium text-foreground">Dicas Rápidas</h4>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                <span>Use a busca para encontrar orçamentos rapidamente</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                <span>Personalize dados da empresa em Configurações</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                <span>Compartilhe orçamentos com um clique no WhatsApp</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link de Suporte WhatsApp */}
        
      </div>


    </>;
};