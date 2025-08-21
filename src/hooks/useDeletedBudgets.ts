import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DeletedBudget {
  id: string;
  client_name?: string;
  device_model?: string;
  device_type?: string;
  deletion_reason?: string;
  deleted_at?: string;
  audit_id?: string;
  [key: string]: any;
}

export const useDeletedBudgets = (userId: string) => {
  const [deletedBudgets, setDeletedBudgets] = useState<DeletedBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeletedBudgets = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('budget_deletion_audit')
        .select('*')
        .eq('deleted_by', userId)
        .eq('can_restore', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedBudgets: DeletedBudget[] = (data || []).map(audit => ({
        id: audit.budget_id || '', // Ensure id is always present
        ...(typeof audit.budget_data === 'object' && audit.budget_data !== null ? audit.budget_data : {}),
        deletion_reason: audit.deletion_reason,
        deleted_at: audit.created_at,
        audit_id: audit.id
      }));

      setDeletedBudgets(formattedBudgets);
    } catch (err: any) {
      console.error('Error fetching deleted budgets:', err);
      setError('Erro ao carregar orçamentos excluídos');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const restoreBudget = useCallback(async (budgetId: string) => {
    try {
      const { data, error } = await supabase.rpc('restore_deleted_budget', {
        p_budget_id: budgetId
      });

      if (error) throw error;

      const response = data as any;
      if (!response?.success) {
        throw new Error(response?.error || 'Falha na restauração do orçamento');
      }

      setDeletedBudgets(prev => prev.filter(b => b.id !== budgetId));
      return { success: true };
    } catch (error) {
      console.error('Error restoring budget:', error);
      return { success: false, error: 'Erro ao restaurar orçamento' };
    }
  }, []);

  const permanentDelete = useCallback(async (budgetId: string) => {
    try {
      const { data, error } = await supabase.rpc('soft_delete_budget_with_audit', {
        p_budget_id: budgetId,
        p_deletion_reason: 'Exclusão permanente via interface'
      });

      if (error) throw error;

      await supabase
        .from('budget_deletion_audit')
        .update({ can_restore: false })
        .eq('budget_id', budgetId)
        .eq('deleted_by', userId);

      setDeletedBudgets(prev => prev.filter(b => b.id !== budgetId));
      return { success: true };
    } catch (error) {
      console.error('Error permanently deleting budget:', error);
      return { success: false, error: 'Erro ao excluir orçamento' };
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchDeletedBudgets();
    }
  }, [userId, fetchDeletedBudgets]);

  return {
    deletedBudgets,
    loading,
    error,
    fetchDeletedBudgets,
    restoreBudget,
    permanentDelete
  };
};