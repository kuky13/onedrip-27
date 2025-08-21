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
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, Settings, AlertCircle, Wrench, Phone, FileText, Share2, ExternalLink, Clock, CheckCircle, XCircle, Pause, Play, PlayCircle, Circle, RotateCcw, ArrowLeft } from 'lucide-react';
import { ServiceOrderStatusActions } from '../components/ServiceOrderStatusActions';
import { useServiceOrderShare } from '../hooks/useServiceOrderShare';
import { useSecureServiceOrders } from '@/hooks/useSecureServiceOrders';
import { useContextualActions } from '@/hooks/useContextualActions';
import { useAuth } from '@/hooks/useAuth';
import { Tables, Enums } from '@/integrations/supabase/types';

type ServiceOrder = Tables<'service_orders'>;
type ServiceOrderStatus = Enums<'service_order_status'>;
type ServiceOrderPriority = Enums<'service_order_priority'>;
const ServiceOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    generateShareToken,
    shareViaWhatsApp,
    isGenerating
  } = useServiceOrderShare();

  // Usar hook seguro para ordens de serviço
  const {
    data: serviceOrdersResponse,
    isLoading,
    error,
    refetch: refetchSecure,
    updateStatusMutation,
    deleteServiceOrderMutation
  } = useSecureServiceOrders(user?.id, {
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter as ServiceOrderStatus : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter as ServiceOrderPriority : undefined,
    limit: 100
  });

  const serviceOrders = serviceOrdersResponse || [];

  // Usar refetch do hook seguro
  const refetch = refetchSecure;

  // Filter service orders
  const filteredServiceOrders = useMemo(() => {
    return serviceOrders.filter(order => {
      const matchesSearch = searchTerm === '' || order.device_model.toLowerCase().includes(searchTerm.toLowerCase()) || order.reported_issue.toLowerCase().includes(searchTerm.toLowerCase()) || order.id.toLowerCase().includes(searchTerm.toLowerCase());
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
        await deleteServiceOrderMutation.mutateAsync(id);
      } catch (error) {
        console.error('Erro ao excluir:', error);
      }
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: ServiceOrderStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
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
  const {
    actions,
    executeAction,
    canExecuteAction,
    getStatusColor,
    getStatusText,
    getStatusIcon
  } = useContextualActions(null);

  // Convert icon name to React component
  const getStatusIconComponent = (status: ServiceOrderStatus) => {
    const iconName = getStatusIcon(status);
    switch (iconName) {
      case 'clock':
        return <Clock className="h-3 w-3" />;
      case 'play-circle':
        return <PlayCircle className="h-3 w-3" />;
      case 'check-circle':
        return <CheckCircle className="h-3 w-3" />;
      case 'x-circle':
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
  // Verificar se não há usuário autenticado para mostrar aviso
  if (!user && !isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Acesso Restrito</h3>
          <p className="text-muted-foreground mb-6">
            Você precisa estar logado para acessar suas ordens de serviço.
          </p>
          <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Fazer Login
          </Button>
        </div>
      </div>
    );
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
  return <div className="container mx-auto p-3 sm:p-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-soft border border-white/20 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Ordens de Serviço
              </h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Gerencie suas ordens de serviço
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => navigate('/service-orders/settings')} 
              className="flex items-center gap-2 bg-white/40 backdrop-blur-sm border-white/30 hover:bg-white/60 text-sm"
              size="sm"
            >
              <Settings className="h-4 w-4" />
              <span className="sm:inline">Configurações</span>
            </Button>
            <Button 
              onClick={() => navigate('/service-orders/new')} 
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white flex items-center gap-2 shadow-medium text-sm"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Nova Ordem</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-soft border border-white/20 p-4 sm:p-6 mb-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Buscar por dispositivo, problema ou ID..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-10 bg-white/60 border-white/30 focus:bg-white/80 transition-all" 
            />
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white/60 border-white/30">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white/60 border-white/30">
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
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className="flex items-center gap-2 bg-white/40 backdrop-blur-sm border-white/30 hover:bg-white/60 flex-1 sm:flex-none"
                size="sm"
                title="Atualizar lista"
              >
                <RotateCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
              </Button>
              
              {activeFiltersCount > 0 && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters} 
                  className="flex items-center gap-2 bg-white/40 backdrop-blur-sm border-white/30 hover:bg-white/60 flex-1 sm:flex-none"
                  size="sm"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Limpar ({activeFiltersCount})</span>
                  <span className="sm:hidden">({activeFiltersCount})</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {isLoading ? <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando ordens de serviço...</p>
            </div>
          </div> : error ? <div className="text-center py-16">
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
            {filteredServiceOrders.map(order => <Card key={order.id} className="bg-white/40 backdrop-blur-md border-white/20 shadow-soft transition-all duration-300 hover:shadow-medium hover:bg-white/50 active:scale-[0.98] rounded-2xl">
                <CardContent className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg sm:text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                          OS #{order.id.slice(-8)}
                        </h3>
                        <Badge variant="outline" className={`text-xs w-fit ${getPriorityColor(order.priority as any)}`}>
                          {getPriorityText(order.priority as any)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/40 backdrop-blur-sm hover:bg-white/60 rounded-full">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-md border-white/30">
                        <DropdownMenuItem onClick={() => navigate(`/service-orders/${order.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        {user?.id === order.owner_id && (
                          <>
                            <DropdownMenuItem onClick={() => navigate(`/service-orders/${order.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(order.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Info Grid - Mobile Optimized */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {/* Client Info */}
                    <div className="bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Cliente:</p>
                      <p className="font-medium text-primary text-sm">
                        {order.client_id ? `ID: ${order.client_id}` : 'Cliente não informado'}
                      </p>
                    </div>

                    {/* Device Info */}
                    <div className="bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Dispositivo:</p>
                      <p className="font-medium text-sm">
                        {order.device_model}
                      </p>
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div className="mb-4">
                    <div className="bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Problema:</p>
                      <p className="text-sm leading-relaxed">
                        {order.reported_issue && order.reported_issue.length > 100 ? `${order.reported_issue.substring(0, 100)}...` : order.reported_issue || 'Descrição não informada'}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <Badge variant="outline" className={`${getStatusColor(order.status as any)} px-3 py-1 rounded-full flex items-center gap-1 w-fit`}>
                      {getStatusIconComponent(order.status as any)}
                      {getStatusText(order.status as any)}
                    </Badge>
                  </div>

                  {/* Status Actions - Only for owners */}
                  {user?.id === order.owner_id && (
                    <div className="mb-6 p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                      <div className="mb-3">
                        <p className="text-sm font-medium text-muted-foreground">Ações de Status:</p>
                      </div>
                      <ServiceOrderStatusActions 
                        serviceOrder={order} 
                        onStatusUpdate={async (newStatus) => {
                          await handleStatusUpdate(order.id, newStatus as ServiceOrderStatus);
                        }} 
                      />
                    </div>
                  )}

                  {/* Price */}
                  {order.total_price && (
                    <div className="mb-4">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm rounded-xl p-4 border border-green-200/50">
                        <p className="text-2xl sm:text-3xl font-bold text-green-700">
                          {formatCurrency(Number(order.total_price))}
                        </p>
                        <p className="text-sm text-green-600">
                          Valor total
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-8 pt-4 border-t border-white/30">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate(`/service-orders/${order.id}`)} 
                      className="flex flex-row sm:flex-col items-center gap-2 sm:gap-1 p-3 sm:p-2 h-auto text-primary hover:text-primary/80 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-xl transition-all flex-1 sm:flex-none justify-center"
                    >
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm sm:text-xs font-medium">Ver Detalhes</span>
                    </Button>
                    
                    {user?.id === order.owner_id && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/service-orders/${order.id}/edit`)} 
                          className="flex flex-row sm:flex-col items-center gap-2 sm:gap-1 p-3 sm:p-2 h-auto text-muted-foreground hover:text-foreground bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-xl transition-all flex-1 sm:flex-none justify-center"
                        >
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="text-sm sm:text-xs font-medium">Editar</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={async () => {
                            const shareData = await generateShareToken(order.id);
                            if (shareData) {
                              const token = shareData.share_url.split('/').pop();
                              navigate(`/share/service-order/${token}`);
                            }
                          }} 
                          disabled={isGenerating} 
                          className="flex flex-row sm:flex-col items-center gap-2 sm:gap-1 p-3 sm:p-2 h-auto text-blue-600 hover:text-blue-700 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-xl transition-all flex-1 sm:flex-none justify-center"
                        >
                          <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="text-sm sm:text-xs font-medium">Compartilhar</span>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </div>
    </div>;
};
export default ServiceOrdersPage;