
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useLicenseValidation = () => {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Não validar licença se ainda estamos carregando a autenticação
    if (authLoading) {
      return;
    }

    const validateLicense = async () => {
      if (!user?.id) {
        setData(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const { data: licenseData, error } = await supabase.rpc('is_license_valid', {
          p_user_id: user.id
        });
        
        if (error) {
          console.error('Error validating license:', error);
          setData(false);
        } else {
          setData(licenseData as boolean);
        }
      } catch (error) {
        console.error('License validation error:', error);
        setData(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateLicense();
    
    // Revalidate every 5 minutes
    const interval = setInterval(validateLicense, 1000 * 60 * 5);
    
    return () => clearInterval(interval);
  }, [user?.id, authLoading]);

  return { data, isLoading: isLoading || authLoading };
};
