import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Filter, 
  RefreshCw, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target_type: 'all' | 'specific';
  target_user_id?: string;
  created_by: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_read?: boolean;
  read_at?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const getNotificationBadgeVariant = (type: string) => {
  switch (type) {
    case 'success':
      return 'default';
    case 'warning':
      return 'secondary';
    case 'error':
      return 'destructive';
    default:
      return 'outline';
  }
};

interface UserNotificationsProps {
  className?: string;
  showFilters?: boolean;
  maxHeight?: string;
}

export const UserNotifications: React.FC<UserNotificationsProps> = ({
  className,
  showFilters = true,
  maxHeight = '400px'
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

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-center">
            <div className="space-y-2">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Erro ao carregar notificações
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshNotifications}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshNotifications}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            
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
            
            {notifications.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={deleteAllNotifications}
                    disabled={isDeletingAllNotifications}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir todas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {showFilters && (
          <div className="flex gap-2 mt-3">
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => updateFilters({ type: value as any })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.read_status || 'all'}
              onValueChange={(value) => updateFilters({ read_status: value as any })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-full" style={{ maxHeight }}>
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse border rounded-lg p-3">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                {filters.read_status === 'unread' 
                  ? 'Nenhuma notificação não lida'
                  : 'Nenhuma notificação encontrada'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification: any, index: number) => (
                <div key={notification.id}>
                  <div
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                      !notification.is_read && "bg-blue-50/50 border-l-4 border-l-blue-500"
                    )}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn(
                            "text-sm font-medium",
                            !notification.is_read && "font-semibold"
                          )}>
                            {notification.title}
                          </h4>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge 
                              variant={getNotificationBadgeVariant(notification.type)}
                              className="text-xs"
                            >
                              {notification.type}
                            </Badge>
                            
                            {notification.is_read ? (
                              <Eye className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <EyeOff className="h-3 w-3 text-blue-500" />
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-muted"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.is_read && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    disabled={isMarkingAsRead}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Marcar como lida
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  disabled={isDeletingNotification}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </div>
                          
                          {notification.expires_at && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Expira {formatDistanceToNow(new Date(notification.expires_at), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </div>
                          )}
                          
                          {notification.is_read && notification.read_at && (
                            <div className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Lida {formatDistanceToNow(new Date(notification.read_at), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              disabled={isMarkingAsRead}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Marcar como lida
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            disabled={isDeletingNotification}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};