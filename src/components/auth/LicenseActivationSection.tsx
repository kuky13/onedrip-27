
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Info, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';

interface LicenseActivationSectionProps {
  user: any;
  onLicenseActivated: () => void;
}

export const LicenseActivationSection = ({ user, onLicenseActivated }: LicenseActivationSectionProps) => {
  const [licenseCode, setLicenseCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [previewDays, setPreviewDays] = useState<number | null>(null);
  const { showSuccess, showError } = useToast();

  const validateLicenseFormat = (code: string) => {
    // Aceita 13 caracteres alfanuméricos
    const regex = /^[A-Z0-9]{13}$/;
    return regex.test(code);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase(); // Remove non-alphanumeric and convert to uppercase
    if (value.length <= 13) {
      setLicenseCode(value);
      
      // Show preview for valid format
      if (validateLicenseFormat(value)) {
        setPreviewDays(30); // Default 30 days for new licenses
      } else {
        setPreviewDays(null);
      }
    }
  };

  const handleActivateLicense = async () => {
    if (!validateLicenseFormat(licenseCode)) {
      showError({
        title: 'Código Inválido',
        description: 'O código deve ter exatamente 13 caracteres (letras e números)'
      });
      return;
    }

    setIsActivating(true);
    try {
      const { data, error } = await supabase.rpc('activate_license', {
        license_code: licenseCode.trim(),
        p_user_id: user.id
      });

      if (error) throw error;

      if ((data as any)?.success) {
        showSuccess({
          title: 'Licença Ativada!',
          description: 'Sua licença foi ativada com sucesso. Redirecionando...'
        });
        setTimeout(() => {
          onLicenseActivated();
        }, 1500);
      } else {
        showError({
          title: 'Erro na Ativação',
          description: (data as any)?.error || 'Código de licença inválido ou já utilizado'
        });
      }
    } catch (error: any) {
      showError({
        title: 'Erro Inesperado',
        description: 'Ocorreu um erro ao ativar a licença. Tente novamente.'
      });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-100 p-2 rounded-full">
            <Key className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-lg text-amber-800">Ative sua Licença</CardTitle>
            <p className="text-sm text-amber-700 mt-1">
              Para acessar o sistema, você precisa ativar uma licença válida
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="license-code" className="text-sm font-medium text-amber-800">
            Código da Licença
          </label>
          <Input
            id="license-code"
            type="text"
            placeholder="ABC123XYZ4567"
            value={licenseCode}
            onChange={handleCodeChange}
            className="font-mono text-center tracking-wider border-amber-200 focus:border-amber-400"
            maxLength={13}
          />
          <p className="text-xs text-amber-600 text-center">
            Digite o código de 13 caracteres (letras e números)
          </p>
        </div>

        {previewDays && (
          <Alert className="border-green-200 bg-green-50">
            <Clock className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Preview:</strong> Esta licença concederá {previewDays} dias de acesso ao sistema
            </AlertDescription>
          </Alert>
        )}

        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Importante:</strong> Cada código só pode ser usado uma vez. Certifique-se de digitar corretamente.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleActivateLicense}
          disabled={isActivating || !validateLicenseFormat(licenseCode)}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          {isActivating ? 'Ativando Licença...' : 'Ativar Licença'}
        </Button>
      </CardContent>
    </Card>
  );
};
