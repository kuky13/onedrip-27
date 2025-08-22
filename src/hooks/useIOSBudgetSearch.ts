import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSecureBudgets } from './useSecureBudgets';
import { useRateLimit } from '@/utils/security/rateLimiting';
import { supabase } from '@/integrations/supabase/client';

interface IOSBudgetSearchFilters {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

interface IOSBudgetSearchState {
  searchTerm: string;
  actualSearchTerm: string;
  filterStatus: string;
  isSearchActive: boolean;
  isSearching: boolean;
}

/**
 * Hook unificado para pesquisa de orçamentos otimizado para iOS
 * Integra useSecureBudgets com controles de UI otimizados
 */
export const useIOSBudgetSearch = (userId: string | undefined) => {
  const [state, setState] = useState<IOSBudgetSearchState>({
    searchTerm: '',
    actualSearchTerm: '',
    filterStatus: 'all',
    isSearchActive: false,
    isSearching: false
  });

  const { checkLimit } = useRateLimit('search');

  // Construir filtros para useSecureBudgets
  const filters = useMemo<IOSBudgetSearchFilters>(() => ({
    search: state.actualSearchTerm || undefined,
    limit: 50,
    offset: 0
  }), [state.actualSearchTerm]);

  // Hook seguro para orçamentos
  const {
    budgets,
    isLoading,
    error,
    refetch,
    invalidate
  } = useSecureBudgets(userId, filters);

  // Filtros locais adicionais para melhor UX
  const filteredBudgets = useMemo(() => {
    let filtered = budgets;

    // Aplicar filtro de status se necessário
    if (state.filterStatus !== 'all') {
      switch (state.filterStatus) {
        case 'pending':
          filtered = filtered.filter(b => b.workflow_status === 'pending');
          break;
        case 'approved':
          filtered = filtered.filter(b => b.workflow_status === 'approved');
          break;
        case 'paid':
          filtered = filtered.filter(b => (b as any).is_paid === true);
          break;
        case 'delivered':
          filtered = filtered.filter(b => (b as any).is_delivered === true);
          break;
        case 'completed':
          filtered = filtered.filter(b => b.workflow_status === 'completed');
          break;
        case 'expired':
          filtered = filtered.filter(b => {
            const expires = (b as any).expires_at;
            if (!expires) return false;
            return new Date(expires) < new Date();
          });
          break;
      }
    }

    return filtered;
  }, [budgets, state.filterStatus]);

  // Handlers otimizados
  const handleSearchChange = useCallback((value: string) => {
    setState(prev => ({
      ...prev,
      searchTerm: value
    }));
  }, []);

  const handleSearchSubmit = useCallback(async (value: string) => {
    // Basic input validation
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return;
    }

    // Rate limiting
    const rateCheck = checkLimit('global');
    if (!rateCheck.allowed) {
      console.warn('Rate limit exceeded for search');
      return;
    }

    // Basic XSS protection
    if (trimmedValue.includes('<script') || trimmedValue.includes('javascript:')) {
      console.warn('Potentially malicious search input blocked');
      return;
    }
    
    setState(prev => ({
      ...prev,
      isSearching: true,
      actualSearchTerm: trimmedValue
    }));

    try {
      // Pequeno delay para melhor UX
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setState(prev => ({
        ...prev,
        isSearching: false
      }));
    }
  }, [checkLimit]);

  const handleSearchClear = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchTerm: '',
      actualSearchTerm: '',
      isSearchActive: false
    }));
  }, []);

  const handleSearchToggle = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSearchActive: !prev.isSearchActive,
      // Limpar busca quando fechar
      searchTerm: prev.isSearchActive ? '' : prev.searchTerm,
      actualSearchTerm: prev.isSearchActive ? '' : prev.actualSearchTerm
    }));
  }, []);

  const handleFilterChange = useCallback((status: string) => {
    setState(prev => ({
      ...prev,
      filterStatus: status
    }));
  }, []);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Delete handler
  const handleDelete = useCallback(async (budgetId: string) => {
    try {
      // Use the secure delete function
      const { data, error } = await supabase.rpc('soft_delete_budget_with_audit', {
        p_budget_id: budgetId,
        p_deletion_reason: 'Exclusão via interface mobile'
      });
      
      if (error) throw error;
      
      const response = data as any;
      if (!response?.success) {
        throw new Error(response?.error || 'Falha na exclusão do orçamento');
      }
      
      // Trigger refresh
      await refetch();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting budget:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao excluir orçamento' 
      };
    }
  }, [refetch]);

  // Auto-clear search quando não há termo
  useEffect(() => {
    if (!state.searchTerm && state.actualSearchTerm) {
      setState(prev => ({
        ...prev,
        actualSearchTerm: ''
      }));
    }
  }, [state.searchTerm, state.actualSearchTerm]);

  return {
    // Data
    budgets: filteredBudgets,
    totalBudgets: budgets.length,
    
    // States
    searchTerm: state.searchTerm,
    actualSearchTerm: state.actualSearchTerm,
    filterStatus: state.filterStatus,
    isSearchActive: state.isSearchActive,
    isSearching: state.isSearching,
    isLoading,
    error,
    
    // Computed
    hasActiveSearch: !!state.actualSearchTerm,
    hasActiveFilters: state.filterStatus !== 'all',
    searchSubtitle: `${filteredBudgets.length} ${filteredBudgets.length === 1 ? 'item' : 'itens'}${state.actualSearchTerm ? ` • "${state.actualSearchTerm}"` : ''}`,
    
    // Handlers
    handleSearchChange,
    handleSearchSubmit,
    handleSearchClear,
    handleSearchToggle,
    handleFilterChange,
    handleRefresh,
    handleDelete,
    
    // Utils
    invalidateCache: invalidate
  };
};