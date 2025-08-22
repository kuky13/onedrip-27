/**
 * Lista de Orçamentos Otimizada para Performance
 * Sistema OneDrip Blueberry - Componente de Alto Desempenho
 */

import { useState, useMemo, useCallback } from 'react';
import { useSecureBudgets } from '@/hooks/useSecureBudgets';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface BudgetListProps {
  limit?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  className?: string;
}

export const PerformanceOptimizedBudgetList = ({ 
  limit = 50, 
  showSearch = true, 
  showFilters = true,
  className = ''
}: BudgetListProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);

  // Filtros memorizados para evitar re-renders desnecessários
  const filters = useMemo(() => ({
    search: searchTerm,
    status: statusFilter || undefined,
    limit,
    offset: page * limit
  }), [searchTerm, statusFilter, limit, page]);

  // Hook seguro e otimizado
  const {
    budgets,
    isLoading,
    error,
    deleteBudget,
    isDeleting,
    refetch
  } = useSecureBudgets(user?.id, filters);

  // Handlers memorizados
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(0); // Reset page quando buscar
  }, []);

  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status);
    setPage(0); // Reset page quando filtrar
  }, []);

  const handleDelete = useCallback((budgetId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      deleteBudget(budgetId);
    }
  }, [deleteBudget]);

  // Formatação de valores memorizadas
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }, []);

  // Status badge colors
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  }, []);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">Erro ao carregar orçamentos</p>
          <Button onClick={() => refetch()} variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com busca e filtros */}
      <div className="space-y-4">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por cliente, dispositivo..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {showFilters && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              variant={statusFilter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter('')}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter('pending')}
            >
              Pendentes
            </Button>
            <Button
              variant={statusFilter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter('approved')}
            >
              Aprovados
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter('completed')}
            >
              Concluídos
            </Button>
          </div>
        )}
      </div>

      {/* Lista de orçamentos */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {searchTerm || statusFilter 
                ? 'Nenhum orçamento encontrado com os filtros aplicados'
                : 'Nenhum orçamento encontrado'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => (
            <Card key={budget.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{budget.client_name}</h3>
                    <p className="text-muted-foreground">
                      {budget.device_type} - {budget.device_model}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(budget.workflow_status)}>
                      {budget.workflow_status}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(budget.id)}
                          disabled={isDeleting}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Valor Total</p>
                    <p className="font-semibold text-lg">{formatCurrency(budget.total_price)}</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Cliente</p>
                    <p className="font-medium">{budget.client_phone}</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Criado em</p>
                    <p className="font-medium">{formatDate(budget.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginação simples */}
      {budgets.length === limit && (
        <div className="flex justify-center">
          <Button
            onClick={() => setPage(p => p + 1)}
            variant="outline"
            disabled={isLoading}
          >
            Carregar Mais
          </Button>
        </div>
      )}
    </div>
  );
};

export default PerformanceOptimizedBudgetList;