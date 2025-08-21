import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LicenseData {
  has_license: boolean;
  is_valid: boolean;
  license_code?: string;
  expires_at?: string;
  activated_at?: string;
  days_remaining?: number;
  message?: string;
  expired_at?: string;
}

export const useEnhancedLicenseValidation = () => {
  const { user } = useAuth();
  const [data, setData] = useState<LicenseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateLicense = async () => {
    if (!user?.id) {
      setData({ has_license: false, is_valid: false, message: 'Usuário não autenticado' });
      return;
    }
    
    setIsLoading(true);
    try {
      const { data: licenseData, error } = await supabase.rpc('is_license_valid', {
        p_user_id: user.id
      });
      
      if (error) {
        console.error('Error validating license:', error);
        setData({ has_license: false, is_valid: false, message: 'Erro ao validar licença' });
      } else {
        setData({ 
          has_license: licenseData, 
          is_valid: licenseData,
          message: licenseData ? 'Licença válida' : 'Licença inválida'
        });
      }
    } catch (error) {
      console.error('License validation error:', error);
      setData({ has_license: false, is_valid: false, message: 'Erro interno' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    validateLicense();
    
    // Revalidar a cada 5 minutos
    const interval = setInterval(validateLicense, 1000 * 60 * 5);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  return { data, isLoading, refetch: validateLicense };
};