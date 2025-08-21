import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LicenseDetails {
  has_license: boolean;
  is_valid: boolean;
  license_code?: string;
  expires_at?: string;
  activated_at?: string;
  days_remaining?: number;
  message?: string;
  expired_at?: string;
}

export const useUserLicenseDetails = () => {
  const { user } = useAuth();
  const [licenseDetails, setLicenseDetails] = useState<LicenseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLicenseDetails = async () => {
    if (!user?.id) {
      setLicenseDetails(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase
        .rpc('validate_user_license', { p_user_id: user.id });

      if (rpcError) {
        console.error('Erro ao buscar detalhes da licença:', rpcError);
        setError('Erro ao carregar informações da licença');
        setLicenseDetails(null);
        return;
      }

      setLicenseDetails(data);
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro inesperado ao carregar licença');
      setLicenseDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenseDetails();

    // Revalidar a cada 5 minutos
    const interval = setInterval(fetchLicenseDetails, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.id]);

  return {
    licenseDetails,
    loading,
    error,
    refetch: fetchLicenseDetails
  };
};