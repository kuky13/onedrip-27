
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBudgetsData = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['budgets', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          id,
          client_name,
          client_phone,
          device_type,
          device_model,
          issue,
          part_quality,
          status,
          workflow_status,
          total_price,
          cash_price,
          installment_price,
          delivery_date,
          expires_at,
          valid_until,
          created_at,
          updated_at,
          owner_id,
          is_paid,
          is_delivered
        `)
        .eq('owner_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    refetchOnWindowFocus: false, // Disable refetch on focus
    refetchInterval: 30000, // Reduced from 10s to 30s
    retry: 2, // Reduced retries
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 15000)
  });
};
