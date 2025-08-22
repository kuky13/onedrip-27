import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Budget = Tables<'budgets'>;

export interface BudgetStats {
  totalBudgets: number;
  deletedBudgets: number;
}

export const useBudgetData = (userId: string) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBudgets = useCallback(async (showRefreshing = false) => {
    if (!userId) return;
    
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('budgets')
        .select('*')
        .eq('owner_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setBudgets(data || []);
    } catch (err: any) {
      console.error('Error fetching budgets:', err);
      setError('Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    await fetchBudgets(true);
  }, [fetchBudgets, refreshing]);

  useEffect(() => {
    if (userId) {
      fetchBudgets();
    }
  }, [userId, fetchBudgets]);

  return {
    budgets,
    loading,
    error,
    refreshing,
    fetchBudgets,
    handleRefresh
  };
};