import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ExpiringBudget {
  budget_id: string;
  client_name: string;
  expires_at: string;
  days_until_expiry: number;
}

export const useAdvancedBudgets = () => {
  const { user, profile } = useAuth();

  // Query para orçamentos vencendo
  const { data: expiringBudgets = [], isLoading: isLoadingExpiring } = useQuery({
    queryKey: ['expiring-budgets', user?.id],
    queryFn: async () => {
      if (!user?.id || !profile?.advanced_features_enabled) return [];
      
      const { data, error } = await supabase
        .rpc('get_expiring_budgets', { p_user_id: user.id });

      if (error) {
        console.error('Error fetching expiring budgets:', error);
        return [];
      }

      return (data || []) as ExpiringBudget[];
    },
    enabled: !!user?.id && !!profile?.advanced_features_enabled,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  });

  // Query para clientes com funcionalidades avançadas
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients-advanced', user?.id],
    queryFn: async () => {
      if (!user?.id || !profile?.advanced_features_enabled) return [];
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching clients:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id && !!profile?.advanced_features_enabled,
  });

  // Query para estatísticas de orçamentos
  const { data: budgetStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['budget-stats', user?.id],
    queryFn: async () => {
      if (!user?.id || !profile?.advanced_features_enabled) return null;
      
      const { data, error } = await supabase
        .from('budgets')
        .select('workflow_status, is_paid, is_delivered, expires_at')
        .eq('owner_id', user.id)
        .is('deleted_at', null);

      if (error) {
        console.error('Error fetching budget stats:', error);
        return null;
      }

      const stats = {
        total: data.length,
        pending: data.filter(b => b.workflow_status === 'pending').length,
        approved: data.filter(b => b.workflow_status === 'approved').length,
        completed: data.filter(b => b.workflow_status === 'completed').length,
        paid: data.filter(b => b.is_paid).length,
        delivered: data.filter(b => b.is_delivered).length,
        expired: data.filter(b => 
          b.workflow_status === 'pending' && 
          b.expires_at && 
          new Date(b.expires_at) < new Date()
        ).length,
      };

      return stats;
    },
    enabled: !!user?.id && !!profile?.advanced_features_enabled,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  const isAdvancedMode = !!profile?.advanced_features_enabled;
  const hasExpiringBudgets = expiringBudgets.length > 0;
  const hasExpiredBudgets = expiringBudgets.some(b => b.days_until_expiry < 0);

  return {
    // Data
    expiringBudgets,
    clients,
    budgetStats,
    
    // States
    isAdvancedMode,
    hasExpiringBudgets,
    hasExpiredBudgets,
    isLoading: isLoadingExpiring || isLoadingClients || isLoadingStats,
    
    // Computed values
    urgentNotifications: expiringBudgets.filter(b => b.days_until_expiry <= 1).length,
    totalNotifications: expiringBudgets.length,
  };
};