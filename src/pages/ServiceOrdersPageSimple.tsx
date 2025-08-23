import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, Settings, AlertCircle, Wrench, Clock, CheckCircle, XCircle, Circle, RotateCcw, ExternalLink, ArrowLeft } from 'lucide-react';
import { ServiceOrderStatusActions } from '../components/ServiceOrderStatusActions';
import { useServiceOrderShare } from '../hooks/useServiceOrderShare';
import { useAuth } from '@/hooks/useAuth';
import { Tables, Enums } from '@/integrations/supabase/types';
type ServiceOrder = Tables<'service_orders'>;
type ServiceOrderStatus = Enums<'service_order_status'>;
type ServiceOrderPriority = Enums<'service_order_priority'>;
const ServiceOrdersPageSimple: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    user,
    loading
  } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    generateShareToken,
    isGenerating
  } = useServiceOrderShare();

  // Fetch service orders with user filter
  const {
    data: serviceOrders = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['service-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const {
        data,
        error
      } = await supabase.from('service_orders').select('*').eq('owner_id', user.id) // Only fetch orders owned by the current user
      .is('deleted_at', null).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data as ServiceOrder[];
    },
    enabled: !!user?.id // Only run query when user is authenticated
  });

  // Delete mutation with user check
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const {
        error
      } = await supabase.from('service_orders').delete().eq('id', id).eq('owner_id', user.id); // Ensure user can only delete their own orders

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['service-orders']
      });
      toast.success('Ordem de serviço excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir ordem de serviço: ' + error.message);
    }
  });

  // Update status mutation with user check
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status
    }: {
      id: string;
      status: ServiceOrderStatus;
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const {
        error
      } = await supabase.from('service_orders').update({
        status,
        updated_at: new Date().toISOString()
      }).eq('id', id).eq('owner_id', user.id); // Ensure user can only update their own orders

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['service-orders']
      });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  });

  // Filter service orders
  const filteredServiceOrders = useMemo(() => {
    return serviceOrders.filter(order => {
      const matchesSearch = searchTerm === '' || order.device_model?.toLowerCase().includes(searchTerm.toLowerCase()) || order.reported_issue?.toLowerCase().includes(searchTerm.toLowerCase()) || order.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [serviceOrders, searchTerm, statusFilter, priorityFilter]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (priorityFilter !== 'all') count++;
    return count;
  }, [searchTerm, statusFilter, priorityFilter]);
  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Erro ao excluir:', error);
      }
    }
  };
  const handleStatusUpdate = async (id: string, newStatus: ServiceOrderStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: newStatus
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Lista atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar a lista');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper functions
  const getStatusColor = (status: ServiceOrderStatus) => {
    switch (status) {
      case 'opened':
        return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'in_progress':
        return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'waiting_parts':
        return 'border-purple-200 bg-purple-50 text-purple-700';
      case 'waiting_client':
        return 'border-orange-200 bg-orange-50 text-orange-700';
      case 'completed':
        return 'border-green-200 bg-green-50 text-green-700';
      case 'cancelled':
        return 'border-red-200 bg-red-50 text-red-700';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };
  const getStatusText = (status: ServiceOrderStatus) => {
    switch (status) {
      case 'opened':
        return 'Aberto';
      case 'in_progress':
        return 'Em Andamento';
      case 'waiting_parts':
        return 'Aguardando Peças';
      case 'waiting_client':
        return 'Aguardando Cliente';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };
  const getStatusIconComponent = (status: ServiceOrderStatus) => {
    switch (status) {
      case 'opened':
        return <Clock className="h-3 w-3" />;
      case 'in_progress':
        return <Circle className="h-3 w-3" />;
      case 'waiting_parts':
      case 'waiting_client':
        return <Clock className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Circle className="h-3 w-3" />;
    }
  };
  const getPriorityColor = (priority: ServiceOrderPriority) => {
    switch (priority) {
      case 'low':
        return 'border-gray-200 bg-gray-50 text-gray-600';
      case 'medium':
        return 'border-blue-200 bg-blue-50 text-blue-600';
      case 'high':
        return 'border-orange-200 bg-orange-50 text-orange-600';
      case 'urgent':
        return 'border-red-200 bg-red-50 text-red-600';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-600';
    }
  };
  const getPriorityText = (priority: ServiceOrderPriority) => {
    switch (priority) {
      case 'low':
        return 'Baixa';
      case 'medium':
        return 'Média';
      case 'high':
        return 'Alta';
      case 'urgent':
        return 'Urgente';
      default:
        return priority;
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
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Show loading while authenticating
  if (loading) {
    return <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando autenticação...</p>
          </div>
        </div>
      </div>;
  }

  // Show auth required message if not logged in
  if (!user) {
    return <div className="container mx-auto p-6">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Acesso Restrito</h3>
          <p className="text-muted-foreground mb-6">
            Você precisa estar logado para acessar suas ordens de serviço.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Fazer Login
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>;
  }
  if (isLoading) {
    return <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando ordens de serviço...</p>
          </div>
        </div>
      </div>;
  }
  return <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/service-orders/settings')} className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Config
          </Button>
          <Button onClick={() => navigate('/service-orders/new')} className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Ordem
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Buscar por dispositivo, problema ou ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="opened">Aberto</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="waiting_parts">Aguardando Peças</SelectItem>
                <SelectItem value="waiting_client">Aguardando Cliente</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2" title="Atualizar lista">
              <RotateCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
            
            {activeFiltersCount > 0 && <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Limpar ({activeFiltersCount})
              </Button>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {error ? <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-medium mb-2">Erro ao carregar ordens</h3>
            <p className="text-muted-foreground mb-6">
              {error?.message || 'Ocorreu um erro ao carregar as ordens de serviço.'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Tentar Novamente
            </Button>
          </div> : serviceOrders.length === 0 ? <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {activeFiltersCount > 0 ? 'Nenhum resultado encontrado' : 'Nenhuma ordem de serviço ainda'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {activeFiltersCount > 0 ? 'Tente ajustar seus filtros ou limpar a busca.' : 'Crie sua primeira ordem de serviço para começar.'}
            </p>
            {activeFiltersCount === 0 && <Button onClick={() => navigate('/service-orders/new')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Criar Ordem de Serviço
              </Button>}
          </div> : <div className="space-y-4">
            {filteredServiceOrders.map(order => <Card key={order.id} className="border-border/50 transition-all duration-200 hover:shadow-lg">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">
                          OS #{order.id.slice(-8)}
                        </h3>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(order.priority)}`}>
                          {getPriorityText(order.priority)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/service-orders/${order.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/service-orders/${order.id}/edit`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(order.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Client and Device Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Client Info */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                      </div>
                      <p className="font-semibold text-foreground">
                        {order.client_name || 'Cliente não informado'}
                      </p>
                      {order.client_phone && <p className="text-sm text-muted-foreground mt-1">
                          {order.client_phone}
                        </p>}
                    </div>

                    {/* Device Info */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <p className="text-sm font-medium text-muted-foreground">Dispositivo</p>
                      </div>
                      <p className="font-semibold text-foreground">
                        {order.device_type && order.device_model ? `${order.device_type} ${order.device_model}` : 'Dispositivo não especificado'}
                      </p>
                      {order.device_serial && <p className="text-sm text-muted-foreground mt-1">
                          S/N: {order.device_serial}
                        </p>}
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Problema:</p>
                    <p className="text-sm">
                      {order.reported_issue && order.reported_issue.length > 100 ? `${order.reported_issue.substring(0, 100)}...` : order.reported_issue || 'Descrição não informada'}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <Badge variant="outline" className={`${getStatusColor(order.status)} px-3 py-1 rounded-full flex items-center gap-1 w-fit`}>
                      {getStatusIconComponent(order.status)}
                      {getStatusText(order.status)}
                    </Badge>
                  </div>

                  {/* Status Actions */}
                  <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-muted-foreground">Ações de Status:</p>
                    </div>
                    <ServiceOrderStatusActions serviceOrder={order} onStatusUpdate={async newStatus => {
                await handleStatusUpdate(order.id, newStatus as ServiceOrderStatus);
              }} />
                  </div>

                  {/* Price */}
                  {order.total_price && <div className="mb-4">
                      <p className="text-2xl font-bold">
                        {formatCurrency(Number(order.total_price))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Valor total
                      </p>
                    </div>}

                  {/* Bottom Actions */}
                  <div className="flex justify-center gap-8 pt-4 border-t border-border/50">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/service-orders/${order.id}`)} className="flex flex-col items-center gap-1 p-2 h-auto text-primary hover:text-primary/80">
                      <Eye className="h-5 w-5" />
                      <span className="text-xs">Ver</span>
                    </Button>
                    
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/service-orders/${order.id}/edit`)} className="flex flex-col items-center gap-1 p-2 h-auto text-muted-foreground hover:text-foreground">
                      <Edit className="h-5 w-5" />
                      <span className="text-xs">Editar</span>
                    </Button>
                    
                    <Button variant="ghost" size="sm" onClick={async () => {
                const shareData = await generateShareToken(order.id);
                if (shareData) {
                  const token = shareData.share_url.split('/').pop();
                  navigate(`/share/service-order/${token}`);
                }
              }} disabled={isGenerating} className="flex flex-col items-center gap-1 p-2 h-auto text-blue-600 hover:text-blue-700">
                      <ExternalLink className="h-5 w-5" />
                      <span className="text-xs">Compartilhar</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </div>
    </div>;
};
export default ServiceOrdersPageSimple;