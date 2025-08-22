import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Bell, Plus, Eye, EyeOff, Send, Users, MessageSquare, AlertCircle, Info, 
  CheckCircle, AlertTriangle, Trash2, Search, Filter, RefreshCw, 
  CheckCheck, Calendar, Target, BarChart3, Download, Archive
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NotificationForm {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetType: 'all' | 'specific' | 'push_enabled';
  targetUserId: string;
  expiresAt: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    case 'error':
      return AlertCircle;
    default:
      return Info;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'text-green-500';
    case 'warning':
      return 'text-yellow-500';
    case 'error':
      return 'text-red-500';
    default:
      return 'text-blue-500';
  }
};

export const AdminNotificationManager: React.FC = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [newNotification, setNewNotification] = useState<NotificationForm>({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all',
    targetUserId: '',
    expiresAt: ''
  });

  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTarget, setFilterTarget] = useState<string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const isAuthenticated = !!user?.id;

  // Buscar usuários para seleção usando RPC admin
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_all_users');
      if (error) throw error;
      return data?.map((user: any) => ({
        id: user.id,
        name: user.name || 'Sem nome'
      })) || [];
    },
    enabled: isAuthenticated
  });

  // Buscar notificações usando RPC admin
  const { data: notifications = [], isLoading: notificationsLoading, refetch } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_notifications', {
        p_limit: 100,
        p_offset: 0
      });
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated
  });

  // Buscar registros de envio usando RPC admin
  const { data: userNotifications = [] } = useQuery({
    queryKey: ['admin-user-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_user_notifications', {
        p_limit: 100,
        p_offset: 0
      });
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated
  });

  const createNotification = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase.rpc('admin_create_notification', {
        p_title: data.title,
        p_message: data.message,
        p_type: data.type,
        p_target_type: data.targetType,
        p_target_user_id: data.targetType === 'specific' ? data.targetUserId : null,
        p_expires_at: data.expiresAt || null
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      refetch();
      showSuccess({
        title: 'Sucesso',
        description: 'Notificação criada com sucesso!'
      });
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all',
        targetUserId: '',
        expiresAt: ''
      });
    },
    onError: (error) => {
      showError({
        title: 'Erro',
        description: 'Erro ao criar notificação: ' + error.message
      });
    }
  });

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('delete_user_notification', {
        p_notification_id: notificationId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      showSuccess({
        title: 'Sucesso',
        description: 'Notificação deletada com sucesso!'
      });
    },
    onError: (error) => {
      showError({
        title: 'Erro',
        description: 'Erro ao deletar notificação: ' + error.message
      });
    }
  });

  // Função para exclusão em lote
  const bulkDeleteNotifications = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const promises = notificationIds.map(id => 
        supabase.rpc('delete_user_notification', { p_notification_id: id })
      );
      const results = await Promise.allSettled(promises);
      const errors = results.filter(result => result.status === 'rejected');
      if (errors.length > 0) {
        throw new Error(`Falha ao excluir ${errors.length} notificações`);
      }
    },
    onSuccess: () => {
      showSuccess({
        title: 'Sucesso',
        description: 'Notificações excluídas com sucesso!'
      });
      setSelectedNotifications([]);
      refetch();
    },
    onError: (error) => {
      showError({
        title: 'Erro',
        description: 'Erro ao excluir notificações em lote: ' + error.message
      });
    }
  });

  // Filtros e busca otimizados
   const filteredNotifications = useMemo(() => {
     if (!notifications) return [];
     
     return notifications.filter(notification => {
      // Filtro de busca
      const matchesSearch = searchTerm === '' || 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de tipo
      const matchesType = filterType === 'all' || notification.type === filterType;
      
      // Filtro de status
      const now = new Date();
      const isExpired = notification.expires_at && new Date(notification.expires_at) < now;
      const isActive = !isExpired;
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && isActive) ||
        (filterStatus === 'expired' && isExpired);
      
      // Filtro de destinatário
      const matchesTarget = filterTarget === 'all' ||
        (filterTarget === 'all_users' && !notification.target_user_id) ||
        (filterTarget === 'specific' && notification.target_user_id) ||
        (filterTarget === 'push_enabled' && notification.target_type === 'push_enabled');
      
      return matchesSearch && matchesType && matchesStatus && matchesTarget;
    });
  }, [notifications, searchTerm, filterType, filterStatus, filterTarget]);

  // Estatísticas das notificações
  const notificationStats = useMemo(() => {
    if (!notifications) return { total: 0, active: 0, expired: 0 };
    
    const now = new Date();
    const total = notifications.length;
    const expired = notifications.filter(n => 
      n.expires_at && new Date(n.expires_at) < now
    ).length;
    const active = total - expired;
    
    return { total, active, expired };
  }, [notifications]);

  // Funções auxiliares
  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    setFilterTarget('all');
  };

  const handleBulkDelete = () => {
    if (selectedNotifications.length === 0) {
      showError({
        title: 'Erro',
        description: 'Selecione pelo menos uma notificação para excluir'
      });
      return;
    }
    
    if (confirm(`Tem certeza que deseja excluir ${selectedNotifications.length} notificação(ões)?`)) {
      bulkDeleteNotifications.mutate(selectedNotifications);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNotification.title || !newNotification.message) {
      showError({
        title: 'Erro',
        description: 'Título e mensagem são obrigatórios'
      });
      return;
    }

    if (newNotification.targetType === 'specific' && !newNotification.targetUserId) {
      showError({
        title: 'Erro',
        description: 'Selecione um usuário para notificação específica'
      });
      return;
    }

    createNotification.mutate(newNotification);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Gerenciar Notificações</h2>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{notificationStats.total}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-green-600">{notificationStats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiradas</p>
                <p className="text-2xl font-bold text-red-600">{notificationStats.expired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário para criar nova notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Notificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título da notificação"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={newNotification.type}
                  onValueChange={(value: any) => setNewNotification(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem *</Label>
              <Textarea
                id="message"
                value={newNotification.message}
                onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Conteúdo da notificação"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetType">Destinatário</Label>
                <Select
                  value={newNotification.targetType}
                  onValueChange={(value: any) => setNewNotification(prev => ({ ...prev, targetType: value, targetUserId: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    <SelectItem value="specific">Usuário específico</SelectItem>
                    <SelectItem value="push_enabled">Usuários com push ativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newNotification.targetType === 'specific' && (
                <div className="space-y-2">
                  <Label htmlFor="targetUser">Usuário</Label>
                  <Select
                    value={newNotification.targetUserId}
                    onValueChange={(value) => setNewNotification(prev => ({ ...prev, targetUserId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Data de Expiração (opcional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={newNotification.expiresAt}
                onChange={(e) => setNewNotification(prev => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>

            <Button 
              type="submit" 
              disabled={createNotification.isPending}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {createNotification.isPending ? 'Enviando...' : 'Criar Notificação'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de notificações existentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notificações ({filteredNotifications.length} de {notifications.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={notificationsLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", notificationsLoading && "animate-spin")} />
                Atualizar
              </Button>
            </div>
          </div>
          
          {/* Barra de busca */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notificações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {selectedNotifications.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteNotifications.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir ({selectedNotifications.length})
              </Button>
            )}
          </div>

          {/* Filtros expandidos */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="expired">Expiradas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Destinatário</Label>
                <Select value={filterTarget} onValueChange={setFilterTarget}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="all_users">Todos usuários</SelectItem>
                    <SelectItem value="specific">Específico</SelectItem>
                    <SelectItem value="push_enabled">Push ativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Seleção em lote */}
          {filteredNotifications.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-2 bg-muted/30 rounded">
              <Checkbox
                checked={selectedNotifications.length === filteredNotifications.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedNotifications.length === filteredNotifications.length
                  ? 'Desmarcar todas'
                  : 'Selecionar todas'
                }
              </span>
              {selectedNotifications.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {selectedNotifications.length} selecionadas
                </Badge>
              )}
            </div>
          )}
          
          <ScrollArea className="h-[400px]">
            {notificationsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse border rounded-lg p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação encontrada</p>
                {(searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterTarget !== 'all') && (
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    Limpar filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification: any) => {
                  const TypeIcon = getTypeIcon(notification.type);
                  const isExpired = notification.expires_at && new Date(notification.expires_at) < new Date();
                  
                  return (
                    <div key={notification.id} className={cn(
                      "border rounded-lg p-4 transition-colors",
                      selectedNotifications.includes(notification.id) && "bg-muted/50 border-primary"
                    )}>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedNotifications.includes(notification.id)}
                          onCheckedChange={() => handleSelectNotification(notification.id)}
                          className="mt-1"
                        />
                        <TypeIcon className={`h-5 w-5 ${getTypeColor(notification.type)} flex-shrink-0 mt-0.5`} />
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{notification.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                              <Badge variant={notification.type === 'info' ? 'outline' : 'secondary'}>
                                {notification.type}
                              </Badge>
                              
                              <Badge variant={notification.target_type === 'all' ? 'default' : 'outline'}>
                                {notification.target_type === 'all' ? 'Todos' : 
                                 notification.target_type === 'specific' ? 'Específico' : 'Push'}
                              </Badge>
                              
                              {isExpired ? (
                                <Badge variant="destructive">
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Expirada
                                </Badge>
                              ) : (
                                <Badge variant="default">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Ativa
                                </Badge>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification.mutate(notification.id)}
                                disabled={deleteNotification.isPending}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {notification.target_user_id 
                                ? 'Usuário específico' 
                                : notification.target_type === 'push_enabled' 
                                  ? 'Usuários com push ativo'
                                  : 'Todos os usuários'
                              }
                            </span>
                            
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Criada: {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR
                              })}
                            </span>
                            
                            {notification.expires_at && (
                              <span className={cn(
                                "flex items-center gap-1",
                                isExpired ? "text-red-500" : "text-orange-500"
                              )}>
                                <AlertCircle className="h-3 w-3" />
                                Expira: {format(new Date(notification.expires_at), "dd/MM/yyyy 'às' HH:mm", {
                                  locale: ptBR
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Histórico de envios */}
      {userNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Histórico de Envios ({userNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {userNotifications.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{item.notification_title}</p>
                      <p className="text-sm text-muted-foreground">
                        Para: {item.user_email}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.delivery_status === 'sent' ? 'default' : 'secondary'}>
                        {item.delivery_status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(item.sent_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};