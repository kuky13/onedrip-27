/**
 * Hook Seguro e Otimizado para Gestão de Orçamentos
 * Sistema Oliver Blueberry - Performance + Segurança
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { validateInput, clientRateLimit, logSecurityEvent } from '@/utils/security/inputValidation';
import { toast } from 'sonner';

interface BudgetFilters {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

interface Budget {
  id: string;
  client_name: string;
  client_phone: string;
  device_type: string;
  device_model: string;
  total_price: number;
  workflow_status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hook principal para gestão segura de orçamentos
 */
export const useSecureBudgets = (userId: string | undefined, filters: BudgetFilters = {}) => {
  const queryClient = useQueryClient();

  // Query otimizada com função RPC para melhor performance
  const budgetsQuery = useQuery({
    queryKey: ['secure-budgets', userId, filters],
    queryFn: async (): Promise<Budget[]> => {
      if (!userId) return [];

      // Validar entrada de busca
      if (filters.search) {
        const validation = validateInput(filters.search, 'search');
        if (!validation.isValid) {
          logSecurityEvent('INVALID_SEARCH_INPUT', {
            threats: validation.threats,
            input: filters.search.substring(0, 50)
          }, 'high');
          throw new Error('Termo de busca inválido');
        }
        filters.search = validation.sanitized;
      }

      // Rate limiting
      const rateLimitKey = `budgets-${userId}`;
      if (!clientRateLimit.checkLimit(rateLimitKey, 10, 60000)) {
        logSecurityEvent('RATE_LIMIT_EXCEEDED', { userId, action: 'fetch_budgets' });
        throw new Error('Muitas solicitações. Tente novamente em alguns minutos.');
      }

      try {
        // Usar função RPC otimizada
        const { data, error } = await supabase.rpc('get_optimized_budgets', {
          p_user_id: userId,
          p_limit: filters.limit || 50,
          p_offset: filters.offset || 0,
          p_search_term: filters.search || null
        });

        if (error) {
          logSecurityEvent('DATABASE_ERROR', { error: error.message, userId });
          throw error;
        }

        return data || [];
      } catch (error) {
        logSecurityEvent('BUDGET_FETCH_ERROR', { error, userId });
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Não retry em erros de segurança
      if (error.message.includes('inválido') || error.message.includes('Rate limit')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Mutation para criar orçamento com validação
  const createBudgetMutation = useMutation({
    mutationFn: async (budgetData: any) => {
      // Validação completa dos dados
      const validationResults = {
        client_name: validateInput(budgetData.client_name, 'form'),
        client_phone: validateInput(budgetData.client_phone, 'form'),
        device_type: validateInput(budgetData.device_type, 'form'),
        device_model: validateInput(budgetData.device_model, 'form')
      };

      // Verificar se alguma validação falhou
      const hasInvalidInput = Object.values(validationResults).some(v => !v.isValid);
      if (hasInvalidInput) {
        const threats = Object.values(validationResults)
          .flatMap(v => v.threats)
          .filter((threat, index, arr) => arr.indexOf(threat) === index);
        
        logSecurityEvent('INVALID_BUDGET_DATA', { threats }, 'high');
        throw new Error('Dados do orçamento contêm caracteres inválidos');
      }

      // Sanitizar dados
      const sanitizedData = {
        ...budgetData,
        client_name: validationResults.client_name.sanitized,
        client_phone: validationResults.client_phone.sanitized,
        device_type: validationResults.device_type.sanitized,
        device_model: validationResults.device_model.sanitized,
        owner_id: userId
      };

      const { data, error } = await supabase
        .from('budgets')
        .insert([sanitizedData])
        .select()
        .single();

      if (error) {
        logSecurityEvent('BUDGET_CREATE_ERROR', { error: error.message });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-budgets'] });
      toast.success('Orçamento criado com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao criar orçamento: ${error.message}`);
    }
  });

  // Mutation para atualizar orçamento
  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Budget> }) => {
      // Validar ID
      if (!id || typeof id !== 'string') {
        logSecurityEvent('INVALID_BUDGET_ID', { id });
        throw new Error('ID do orçamento inválido');
      }

      // Validar dados se fornecidos
      const sanitizedData: any = {};
      if (data.client_name) {
        const validation = validateInput(data.client_name, 'form');
        if (!validation.isValid) {
          logSecurityEvent('INVALID_UPDATE_DATA', { field: 'client_name' });
          throw new Error('Nome do cliente inválido');
        }
        sanitizedData.client_name = validation.sanitized;
      }

      if (data.device_model) {
        const validation = validateInput(data.device_model, 'form');
        if (!validation.isValid) {
          logSecurityEvent('INVALID_UPDATE_DATA', { field: 'device_model' });
          throw new Error('Modelo do dispositivo inválido');
        }
        sanitizedData.device_model = validation.sanitized;
      }

      const { data: result, error } = await supabase
        .from('budgets')
        .update(sanitizedData)
        .eq('id', id)
        .eq('owner_id', userId)
        .select()
        .single();

      if (error) {
        logSecurityEvent('BUDGET_UPDATE_ERROR', { error: error.message, budgetId: id });
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-budgets'] });
      toast.success('Orçamento atualizado com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar orçamento: ${error.message}`);
    }
  });

  // Mutation para excluir orçamento
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      if (!budgetId || typeof budgetId !== 'string') {
        logSecurityEvent('INVALID_DELETE_ID', { budgetId });
        throw new Error('ID do orçamento inválido');
      }

      const { data, error } = await supabase.rpc('soft_delete_budget_with_audit', {
        p_budget_id: budgetId,
        p_deletion_reason: 'Exclusão via interface'
      });

      if (error || !(data as any)?.success) {
        logSecurityEvent('BUDGET_DELETE_ERROR', { error, budgetId });
        throw new Error((data as any)?.error || error?.message || 'Erro ao excluir orçamento');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-budgets'] });
      toast.success('Orçamento excluído com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao excluir orçamento: ${error.message}`);
    }
  });

  return {
    // Data
    budgets: budgetsQuery.data || [],
    isLoading: budgetsQuery.isLoading,
    error: budgetsQuery.error,
    
    // Mutations
    createBudget: createBudgetMutation.mutate,
    updateBudget: updateBudgetMutation.mutate,
    deleteBudget: deleteBudgetMutation.mutate,
    
    // States
    isCreating: createBudgetMutation.isPending,
    isUpdating: updateBudgetMutation.isPending,
    isDeleting: deleteBudgetMutation.isPending,
    
    // Utils
    refetch: budgetsQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['secure-budgets'] })
  };
};

/**
 * Hook para estatísticas de performance
 */
export const useBudgetStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['budget-stats', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase.rpc('admin_get_user_metrics', {
        p_user_id: userId
      });

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: false
  });
};