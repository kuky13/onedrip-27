import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useNotifications, type NotificationData } from '@/hooks/useNotifications';
import { NotificationCard } from './NotificationCard';
import { NotificationFiltersComponent } from './NotificationFilters';
import { 
  Bell, 
  RefreshCw, 
  AlertCircle, 
  CheckCheck,
  Trash2,
  X,
  Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizedNotificationPanelProps {
  className?: string;
  isFullPage?: boolean;
  onClose?: () => void;
}

export const OptimizedNotificationPanel: React.FC<OptimizedNotificationPanelProps> = ({
  className,
  isFullPage = false,
  onClose
}) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    filters,
    markAsRead,
    markAllAsRead,
    updateFilters,
    refreshNotifications,
    isMarkingAsRead,
    isMarkingAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    isDeletingNotification,
    isDeletingAllNotifications
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Memoized filtered notifications for better performance
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification =>
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [notifications, searchTerm]);

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };

  const handleBulkMarkAsRead = () => {
    selectedNotifications.forEach(id => {
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.is_read) {
        markAsRead(id);
      }
    });
    setSelectedNotifications([]);
  };

  const handleBulkDelete = () => {
    selectedNotifications.forEach(id => {
      deleteNotification(id);
    });
    setSelectedNotifications([]);
    setShowDeleteConfirm(false);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    updateFilters({ type: 'all', read_status: 'all' });
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-center">
            <div className="space-y-3">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="font-medium text-foreground">Erro ao carregar notificações</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Não foi possível carregar suas notificações. Verifique sua conexão.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshNotifications}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Tentar novamente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header com glass effect */}
      <div className="glass-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-6 w-6 text-foreground" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {isFullPage ? 'Suas Mensagens' : 'Central de Mensagens'}
              </h2>
              <p className="text-muted-foreground mt-2 text-lg">
                {unreadCount > 0 
                  ? `${unreadCount} ${unreadCount === 1 ? 'mensagem não lida' : 'mensagens não lidas'}`
                  : 'Todas as mensagens foram lidas'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshNotifications}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Filters */}
        <NotificationFiltersComponent
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={handleClearFilters}
        />
        
        {/* Filtros e ações */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filters.read_status === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilters({ ...filters, read_status: 'all' })}
              className={cn(
                "text-sm font-medium transition-all duration-200",
                filters.read_status === 'all' 
                  ? "bg-primary text-primary-foreground shadow-medium" 
                  : "glass hover:bg-muted/50"
              )}
            >
              Todas ({notifications.length})
            </Button>
            <Button
              variant={filters.read_status === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilters({ ...filters, read_status: 'unread' })}
              className={cn(
                "text-sm font-medium transition-all duration-200",
                filters.read_status === 'unread' 
                  ? "bg-primary text-primary-foreground shadow-medium" 
                  : "glass hover:bg-muted/50"
              )}
            >
              Não lidas ({unreadCount})
            </Button>
            <Button
              variant={filters.read_status === 'read' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilters({ ...filters, read_status: 'read' })}
              className={cn(
                "text-sm font-medium transition-all duration-200",
                filters.read_status === 'read' 
                  ? "bg-primary text-primary-foreground shadow-medium" 
                  : "glass hover:bg-muted/50"
              )}
            >
              Lidas ({notifications.length - unreadCount})
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {filteredNotifications.length > 0 && (
        <div className="border-b bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedNotifications.length === filteredNotifications.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedNotifications.length > 0 
                  ? `${selectedNotifications.length} selecionada${selectedNotifications.length > 1 ? 's' : ''}` 
                  : 'Selecionar todas'
                }
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsRead()}
                  disabled={isMarkingAllAsRead}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Marcar todas como lidas
                </Button>
              )}

              {selectedNotifications.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkMarkAsRead}
                    disabled={isMarkingAsRead}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Marcar como lidas
                  </Button>
                  
                  <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirmar exclusão</DialogTitle>
                        <DialogDescription>
                          Tem certeza que deseja excluir {selectedNotifications.length} notificação{selectedNotifications.length > 1 ? 'ões' : ''}? Esta ação não pode ser desfeita.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleBulkDelete}
                          disabled={isDeletingNotification}
                        >
                          Excluir
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteAllNotifications}
                  disabled={isDeletingAllNotifications}
                  className="text-destructive hover:text-destructive"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Limpar todas
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Lista de notificações com glass effect */}
      <div className="flex-1 overflow-hidden mt-6">
        <div className="glass-card h-full">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-muted/50 h-24 rounded-xl"></div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-16">
                  <div className="glass-card rounded-full p-6 w-24 h-24 mx-auto mb-6">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {searchTerm ? 'Nenhuma mensagem encontrada' : 'Nenhuma mensagem'}
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    {searchTerm 
                      ? 'Tente ajustar os filtros ou termo de busca'
                      : filters.read_status === 'unread' 
                        ? 'Você não tem mensagens não lidas'
                        : 'Você não tem mensagens no momento'
                    }
                  </p>
                  {searchTerm && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearFilters}
                      className="mt-4"
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>
              ) : (
                 <div className="space-y-4">
                   {filteredNotifications.map((notification, index) => (
                     <div
                       key={notification.id}
                       className="animate-in slide-in-from-bottom-4 fade-in"
                       style={{
                         animationDelay: `${index * 100}ms`,
                         animationDuration: '500ms',
                         animationFillMode: 'both'
                       }}
                     >
                       <NotificationCard
                         notification={notification as NotificationData}
                         isSelected={selectedNotifications.includes(notification.id)}
                         onSelect={handleSelectNotification}
                         onMarkAsRead={markAsRead}
                         onDelete={deleteNotification}
                         isMarkingAsRead={isMarkingAsRead}
                         isDeletingNotification={isDeletingNotification}
                       />
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );

  if (isFullPage) {
    return (
      <div className="container mx-auto py-6">
        <Card className="h-[calc(100vh-8rem)]">
          {content}
        </Card>
      </div>
    );
  }

  return <Card className={className}>{content}</Card>;
};