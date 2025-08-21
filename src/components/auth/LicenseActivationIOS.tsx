import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Info, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
interface LicenseActivationIOSProps {
  user: any;
  onLicenseActivated: () => void;
}
export const LicenseActivationIOS = ({
  user,
  onLicenseActivated
}: LicenseActivationIOSProps) => {
  const [licenseCode, setLicenseCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [previewDays, setPreviewDays] = useState<number | null>(null);
  const {
    showSuccess,
    showError
  } = useToast();
  const validateLicenseFormat = (code: string) => {
    // Aceita 13 caracteres alfanuméricos
    const regex = /^[A-Z0-9]{13}$/;
    return regex.test(code);
  };
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (value.length <= 13) {
      setLicenseCode(value);
      if (validateLicenseFormat(value)) {
        setPreviewDays(30);
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
      const {
        data,
        error
      } = await supabase.rpc('activate_license', {
        license_code: licenseCode.trim(),
        p_user_id: user.id
      });
      if (error) throw error;
      if ((data as any)?.success) {
        showSuccess({
          title: 'Licença Ativada!',
          description: 'Sua licença foi ativada com sucesso.'
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
  return <div className="w-full max-w-md mx-auto p-4" style={{
    WebkitTapHighlightColor: 'transparent'
  }}>
      
    </div>;
};