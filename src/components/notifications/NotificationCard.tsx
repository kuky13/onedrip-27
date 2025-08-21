import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  Eye,
  EyeOff,
  MoreVertical,
  Trash2,
  Clock,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { NotificationData } from '@/hooks/useNotifications';

const getNotificationIcon = (type: string) => {
  const iconClass = "w-6 h-6";
  
  switch (type) {
    case 'success':
      return <CheckCircle className={cn(iconClass, "text-success-600")} />;
    case 'warning':
      return <AlertTriangle className={cn(iconClass, "text-warning-600")} />;
    case 'error':
      return <XCircle className={cn(iconClass, "text-error-600")} />;
    case 'info':
    default:
      return <Info className={cn(iconClass, "text-info-600")} />;
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

const getNotificationStyles = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-gradient-to-br from-success-100 to-success-200 border-success-300';
    case 'warning':
      return 'bg-gradient-to-br from-warning-100 to-warning-200 border-warning-300';
    case 'error':
      return 'bg-gradient-to-br from-error-100 to-error-200 border-error-300';
    case 'info':
    default:
      return 'bg-gradient-to-br from-info-100 to-info-200 border-info-300';
  }
};

interface NotificationCardProps {
  notification: NotificationData;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  isMarkingAsRead: boolean;
  isDeletingNotification: boolean;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  isSelected,
  onSelect,
  onMarkAsRead,
  onDelete,
  isMarkingAsRead,
  isDeletingNotification
}) => {
  return (
    <div
      className={cn(
        "group relative p-5 rounded-xl border transition-all duration-300",
        "glass-card hover:shadow-medium hover:scale-[1.02] cursor-pointer",
        notification.is_read
          ? "opacity-80"
          : "shadow-soft hover:shadow-elevated",
        "ring-0 hover:ring-2 hover:ring-primary/20",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(notification.id)}
          className="mt-1"
        />
        
        {/* Ícone com cores semânticas */}
        <div className="flex-shrink-0">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all duration-200",
            getNotificationStyles(notification.type),
            "shadow-soft border border-border/20"
          )}>
            {getNotificationIcon(notification.type)}
          </div>
        </div>
        
        <div className="flex-1 min-w-0 ml-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className={cn(
              "font-display font-semibold text-lg leading-tight line-clamp-2",
              "tracking-tight",
              !notification.is_read ? "font-bold text-foreground" : "font-medium text-muted-foreground"
            )}>
              {notification.title}
            </h4>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge 
                variant={getNotificationBadgeVariant(notification.type)}
                className="text-xs uppercase tracking-wide"
              >
                {notification.type}
              </Badge>
              
              {notification.is_read ? (
                <Eye className="h-4 w-4 text-muted-foreground" />
              ) : (
                <EyeOff className="h-4 w-4 text-primary" />
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-9 w-9 p-0 rounded-lg transition-all duration-200",
                      "hover:bg-muted hover:text-foreground hover:scale-110",
                      "active:scale-95 shadow-soft opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!notification.is_read && (
                    <DropdownMenuItem
                      onClick={() => onMarkAsRead(notification.id)}
                      disabled={isMarkingAsRead}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Marcar como lida
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(notification.id)}
                    disabled={isDeletingNotification}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <p className="font-body text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-3 tracking-normal">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
            
            {!notification.is_read && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-primary to-primary/80 rounded-full animate-pulse shadow-soft" />
                <span className="text-primary font-medium text-xs uppercase tracking-wide">Nova</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};