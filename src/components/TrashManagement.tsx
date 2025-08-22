import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Trash2, RotateCcw, AlertTriangle } from '@/components/ui/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useBudgetDeletion } from '@/hooks/useBudgetDeletion';

import { TrashFiltersComponent, TrashFilters } from '@/components/trash/TrashFilters';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface DeletedBudget {
  id: string;
  budget_data: any;
  created_at: string;
  deletion_reason?: string;
  can_restore: boolean;
}

export const TrashManagement = () => {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { handleRestore, isRestoring } = useBudgetDeletion();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<TrashFilters>({
    search: '',
    sortBy: 'date',
    sortOrder: 'desc',
    deviceType: 'all',
    expirationFilter: 'all'
  });

  // Detectar iOS para otimizações específicas
  const isIOS = useMemo(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);

  // Buscar orçamentos excluídos com otimização específica para iOS
  const {
    data: deletedBudgets,
    isLoading,
    refetch,
    error: queryError
  } = useQuery({
    queryKey: ['deleted-budgets', user?.id, isIOS],
    queryFn: async () => {
      if (!user?.id) {
        console.log('TrashManagement: Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      console.log('TrashManagement: Buscando itens da lixeira para usuário:', user.id, 'iOS:', isIOS);
      
      try {
        // Para iOS, usar uma abordagem mais robusta
        const query = supabase
          .from('budget_deletion_audit')
          .select('*')
          .eq('deleted_by', user.id)
          .eq('can_restore', true)
          .order('created_at', { ascending: false });
          
        // Para iOS, aguardar um pouco mais para evitar problemas de cache
        if (isIOS) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('TrashManagement: Erro ao buscar lixeira:', error);
          throw error;
        }
        
        console.log('Debug - Trashed budgets found:', data?.length || 0, data);
        return data as DeletedBudget[];
      } catch (error) {
        console.error('TrashManagement: Falha na query:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: isIOS ? 0 : 5000, // iOS sempre busca dados frescos
    refetchOnMount: true,
    refetchOnWindowFocus: isIOS, // iOS refetch ao focar
    retry: isIOS ? 3 : 1, // iOS tenta mais vezes
    retryDelay: isIOS ? 1000 : 500 // iOS aguarda mais entre tentativas
  });

  // Função para invalidar todas as queries relacionadas
  const invalidateAllQueries = () => {
    queryClient.invalidateQueries({
      queryKey: ['deleted-budgets']
    });
    queryClient.invalidateQueries({
      queryKey: ['budgets']
    });
    // Forçar refetch da query atual
    refetch();
  };

  // Excluir permanentemente - versão otimizada e simplificada
  const permanentDeleteMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const currentUser = await supabase.auth.getUser();
      const userId = currentUser.data.user?.id;
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }
      console.log(`Iniciando exclusão permanente do orçamento ${budgetId}`);

      // Marcar como não restaurável na auditoria - mais eficiente e direto
      const { error: auditError, data: auditData } = await supabase
        .from('budget_deletion_audit')
        .update({ can_restore: false })
        .eq('budget_id', budgetId)
        .eq('deleted_by', userId)
        .select();
        
      if (auditError) {
        console.error('ERRO ao atualizar auditoria:', auditError);
        throw new Error(`Falha ao atualizar registro de auditoria: ${auditError.message}`);
      }
      
      if (!auditData || auditData.length === 0) {
        throw new Error('Orçamento não encontrado na lixeira');
      }
      
      console.log(`Registro de auditoria atualizado com sucesso para orçamento ${budgetId}`);
      return { budgetId, success: true };
    },
    onSuccess: async data => {
      console.log(`Exclusão permanente concluída para ${data.budgetId}`);
      
      // Invalidação otimizada
      queryClient.setQueryData(['deleted-budgets', user?.id, isIOS], (oldData: DeletedBudget[] | undefined) =>
        oldData?.filter(item => item.budget_data.id !== data.budgetId) || []
      );
      
      await refetch();
      
      showSuccess({
        title: "Orçamento excluído permanentemente",
        description: "O orçamento foi removido da lixeira."
      });
    },
    onError: (error: Error) => {
      console.error('Erro na exclusão permanente:', error);
      showError({
        title: "Erro ao excluir permanentemente",
        description: error.message || "Não foi possível excluir o orçamento permanentemente."
      });
    }
  });

  // Excluir todos permanentemente - versão otimizada
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const currentUser = await supabase.auth.getUser();
      const userId = currentUser.data.user?.id;
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }
      if (!deletedBudgets || deletedBudgets.length === 0) {
        throw new Error('Nenhum orçamento na lixeira para excluir');
      }
      
      console.log(`Iniciando exclusão em massa de ${deletedBudgets.length} orçamentos`);
      
      // Marcar todos como não restauráveis em batch
      const budgetIds = deletedBudgets.map(item => item.budget_data.id);
      
      const { error: auditError, data: auditData } = await supabase
        .from('budget_deletion_audit')
        .update({ can_restore: false })
        .in('budget_id', budgetIds)
        .eq('deleted_by', userId)
        .select();
        
      if (auditError) {
        throw new Error(`Falha ao atualizar registros de auditoria: ${auditError.message}`);
      }
      
      const successCount = auditData?.length || 0;
      const errorCount = deletedBudgets.length - successCount;
      
      console.log(`Exclusão em massa concluída: ${successCount} sucessos, ${errorCount} erros`);
      
      return { successCount, errorCount, totalCount: deletedBudgets.length };
    },
    onSuccess: async ({ successCount, errorCount, totalCount }) => {
      console.log(`Exclusão em massa finalizada: ${successCount}/${totalCount} sucessos`);

      // Limpar cache local
      queryClient.setQueryData(['deleted-budgets', user?.id, isIOS], []);
      await refetch();

      if (errorCount === 0) {
        showSuccess({
          title: "Lixeira esvaziada",
          description: `${successCount} orçamento(s) foram removidos da lixeira.`
        });
      } else if (successCount > 0) {
        showSuccess({
          title: "Limpeza parcial da lixeira",
          description: `${successCount} de ${totalCount} orçamentos foram excluídos. ${errorCount} falharam.`
        });
      } else {
        showError({
          title: "Falha ao esvaziar lixeira",
          description: `Não foi possível excluir nenhum dos ${totalCount} orçamentos da lixeira.`
        });
      }
    },
    onError: (error: Error) => {
      console.error('Erro na exclusão em massa da lixeira:', error);
      showError({
        title: "Erro ao esvaziar lixeira",
        description: error.message || "Não foi possível esvaziar a lixeira."
      });
    }
  });
  const handleRestoreBudget = async (budgetId: string) => {
    try {
      await handleRestore(budgetId);
      invalidateAllQueries();
    } catch (error) {
      console.error('Erro ao restaurar:', error);
    }
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      invalidateAllQueries();
    } finally {
      setIsRefreshing(false);
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Filtrar e ordenar dados
  const {
    filteredBudgets,
    deviceTypes
  } = useMemo(() => {
    if (!deletedBudgets) return {
      filteredBudgets: [],
      deviceTypes: []
    };

    // Extrair tipos de dispositivos únicos
    const types = [...new Set(deletedBudgets.map(item => item.budget_data.device_type).filter(Boolean))];

    // Aplicar filtros
    let filtered = deletedBudgets.filter(item => {
      // Filtro de busca
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = item.budget_data.device_model?.toLowerCase().includes(searchLower) || item.budget_data.client_name?.toLowerCase().includes(searchLower) || item.deletion_reason?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro por tipo de dispositivo
      if (filters.deviceType && filters.deviceType !== 'all' && item.budget_data.device_type !== filters.deviceType) {
        return false;
      }

      // Filtro por expiração
      if (filters.expirationFilter !== 'all') {
        const createdDate = new Date(item.created_at);
        const now = new Date();
        const diffTime = now.getTime() - createdDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, 90 - diffDays);
        if (filters.expirationFilter === 'expiring' && daysLeft > 7) {
          return false;
        }
        if (filters.expirationFilter === 'recent' && diffDays > 7) {
          return false;
        }
      }
      return true;
    });

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = (a.budget_data.device_model || '').localeCompare(b.budget_data.device_model || '');
          break;
        case 'value':
          comparison = (a.budget_data.total_price || 0) - (b.budget_data.total_price || 0);
          break;
        case 'expiration':
          const getDaysLeft = (createdAt: string) => {
            const createdDate = new Date(createdAt);
            const now = new Date();
            const diffTime = now.getTime() - createdDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return Math.max(0, 90 - diffDays);
          };
          comparison = getDaysLeft(a.created_at) - getDaysLeft(b.created_at);
          break;
        case 'date':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
    return {
      filteredBudgets: filtered,
      deviceTypes: types
    };
  }, [deletedBudgets, filters]);
  // Debug para entender o problema
  console.log('TrashManagement render:', {
    isLoading,
    queryError,
    user: user?.id,
    deletedBudgets: deletedBudgets?.length,
    filteredBudgets: filteredBudgets?.length
  });

  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Lixeira
          </CardTitle>
          <CardDescription>
            Carregando orçamentos excluídos...
          </CardDescription>
        </CardHeader>
      </Card>;
  }

  if (queryError) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Lixeira - Erro
          </CardTitle>
          <CardDescription>
            Erro ao carregar lixeira: {typeof queryError === 'string' ? queryError : queryError?.message || 'Erro desconhecido'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Lixeira
        </CardTitle>
        <CardDescription>
          Gerencie os orçamentos excluídos. Os orçamentos ficam na lixeira por 90 dias antes da exclusão automática.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        {deletedBudgets && deletedBudgets.length > 0 && <TrashFiltersComponent filters={filters} onFiltersChange={setFilters} totalCount={deletedBudgets.length} filteredCount={filteredBudgets.length} deviceTypes={deviceTypes} />}

        {/* Ações principais */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {deletedBudgets && deletedBudgets.length > 0 && <>
                <AlertCircle className="h-4 w-4" />
                
              </>}
          </div>
          <div className="flex items-center gap-2">
            {deletedBudgets && deletedBudgets.length > 0 && <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={deleteAllMutation.isPending} className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Esvaziar Lixeira
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Esvaziar Lixeira Permanentemente
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <strong>Esta ação não pode ser desfeita!</strong>
                      <br />
                      Todos os {deletedBudgets.length} orçamentos na lixeira serão completamente removidos da base de dados e não poderão ser recuperados.
                      <br /><br />
                      Tem certeza de que deseja continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteAllMutation.mutate()} className="bg-destructive hover:bg-destructive/90" disabled={deleteAllMutation.isPending}>
                      {deleteAllMutation.isPending ? 'Esvaziando...' : 'Confirmar Exclusão de Todos'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>}
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2">
              <RotateCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {!deletedBudgets || deletedBudgets.length === 0 ? <div className="text-center py-12 text-muted-foreground">
            <Trash2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Lixeira vazia</h3>
            <p>Nenhum orçamento foi excluído recentemente</p>
          </div> : filteredBudgets.length === 0 ? <div className="text-center py-12 text-muted-foreground">
            <Trash2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
            <p>Ajuste os filtros para ver mais resultados</p>
          </div> : <div className="space-y-4">
            {filteredBudgets.map(item => (
              <Card key={item.id} className="border-l-4 border-l-muted">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{item.budget_data.device_model}</h4>
                      <p className="text-sm text-muted-foreground">{formatDate(item.created_at)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRestoreBudget(item.budget_data.id)}
                        disabled={isRestoring || permanentDeleteMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurar
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => permanentDeleteMutation.mutate(item.budget_data.id)}
                        disabled={isRestoring || permanentDeleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>}
      </CardContent>
    </Card>;
};