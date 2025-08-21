import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Key, MessageCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
export const LicenseExpiredPage = () => {
  const [licenseCode, setLicenseCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const {
    user
  } = useAuth();
  const {
    showSuccess,
    showError
  } = useToast();
  const handleActivateLicense = async () => {
    if (!licenseCode.trim()) {
      showError({
        title: 'Código Obrigatório',
        description: 'Por favor, insira um código de licença válido.'
      });
      return;
    }
    
    // Validar formato do código (13 caracteres alfanuméricos)
    if (licenseCode.length !== 13 || !/^[A-Z0-9]{13}$/.test(licenseCode)) {
      showError({
        title: 'Formato Inválido',
        description: 'O código deve ter exatamente 13 caracteres (letras e números).'
      });
      return;
    }
    
    if (!user?.id) {
      showError({
        title: 'Erro de Autenticação',
        description: 'Usuário não encontrado. Faça login novamente.'
      });
      return;
    }
    setIsActivating(true);
    try {
      const {
        data,
        error
      } = await supabase.rpc('activate_license', {
        license_code: licenseCode.trim(),
        p_user_id: user.id
      });
      if (error) {
        throw error;
      }
      if ((data as any)?.success) {
        showSuccess({
          title: 'Licença Ativada!',
          description: (data as any).message || 'Sua licença foi ativada com sucesso.'
        });
        // Navigate to dashboard to refresh auth state
        window.location.href = '/dashboard';
      } else {
        showError({
          title: 'Erro na Ativação',
          description: (data as any)?.error || 'Código de licença inválido ou já utilizado.'
        });
      }
    } catch (error: any) {
      console.error('Error activating license:', error);
      showError({
        title: 'Erro Inesperado',
        description: 'Ocorreu um erro ao ativar a licença. Tente novamente.'
      });
    } finally {
      setIsActivating(false);
    }
  };
  const handleWhatsAppContact = () => {
    const message = encodeURIComponent('Olá! Preciso de ajuda com minha licença do Oliver.');
    const whatsappUrl = `https://wa.me/5564996028022?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Licença Expirada</h1>
          <p className="text-muted-foreground">
            Sua licença expirou ou não está ativa. Ative uma nova licença para continuar.
          </p>
        </div>

        {/* License Activation Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Ativar Licença</CardTitle>
            
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="license-code" className="text-sm font-medium text-foreground">
                Código da Licença
              </label>
              <Input id="license-code" type="text" placeholder="Ex: ABC123XYZ4567" value={licenseCode} onChange={e => setLicenseCode(e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 13))} className="font-mono text-center tracking-wider" maxLength={13} />
              <p className="text-xs text-muted-foreground text-center">Formato: ABC123XYZ4567 (13 caracteres)</p>
            </div>

            <Button onClick={handleActivateLicense} disabled={isActivating || licenseCode.length !== 13} className="w-full">
              {isActivating ? 'Ativando...' : 'Ativar Licença'}
            </Button>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Cada código de licença só pode ser usado uma vez. Certifique-se de digitar corretamente.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Support Card */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Precisa de Ajuda?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Entre em contato conosco pelo WhatsApp para obter suporte ou adquirir uma nova licença.
                </p>
              </div>
              <Button onClick={handleWhatsAppContact} variant="outline" className="w-full">
                <MessageCircle className="mr-2 h-4 w-4" />
                Falar no WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};