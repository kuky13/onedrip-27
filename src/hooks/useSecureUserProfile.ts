import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useSecureUserProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['secure-user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          name,
          role,
          budget_limit,
          budget_warning_enabled,
          budget_warning_days,
          advanced_features_enabled,
          created_at,
          updated_at
        `)
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};