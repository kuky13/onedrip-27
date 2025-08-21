/**
 * Modern Notifications - OneDrip Design System
 * Sistema de notificações rico e interativo
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  X, 
  Bell,
  Clock,
  User,
  FileText,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Text, Heading } from '@/components/ui/typography';
import { GlassCard } from './modern-cards';

// Tipos de notificação
export type NotificationType = 'success' | 'warning' | 'error' | 'info';
export type NotificationCategory = 'budget' | 'client' | 'system' | 'payment';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive';
  }>;
  data?: any;
}

// Componente de notificação individual
interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  compact?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
  onMarkAsRead,
  compact = false
}) => {
  const icons = {
    success: CheckCircle,
    warning: AlertCircle,
    error: XCircle,
    info: Info
  };

  const categoryIcons = {
    budget: FileText,
    client: User,
    system: Bell,
    payment: DollarSign
  };

  const colors = {
    success: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
    warning: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400',
    error: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400',
    info: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400'
  };

  const Icon = icons[notification.type];
  const CategoryIcon = categoryIcons[notification.category];

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      layout
      className={cn(
        'relative group',
        !notification.read && 'ring-2 ring-primary/20'
      )}
    >
      <GlassCard 
        variant="premium" 
        className={cn(
          'p-4 hover:shadow-strong transition-all duration-300',
          !notification.read && 'bg-primary/5'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Ícone da categoria */}
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            colors[notification.type]
          )}>
            <CategoryIcon className="h-5 w-5" />
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Heading 
                    level="h4" 
                    size="sm" 
                    weight="semibold"
                    className={cn(!notification.read && 'text-foreground')}
                  >
                    {notification.title}
                  </Heading>
                  <Icon className={cn('h-4 w-4', colors[notification.type].split(' ')[0])} />
                </div>
                
                <Text 
                  size="sm" 
                  color="secondary" 
                  className="mb-2 line-clamp-2"
                >
                  {notification.message}
                </Text>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(notification.timestamp)}</span>
                </div>
              </div>

              {/* Botão de fechar */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(notification.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Ações */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {notification.actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => {
                      action.action();
                      onMarkAsRead(notification.id);
                    }}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Indicador de não lida */}
        {!notification.read && (
          <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full" />
        )}
      </GlassCard>
    </motion.div>
  );
};

// Container de notificações
interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onDismiss,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  className
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={cn('w-full max-w-md', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heading level="h3" size="lg" weight="semibold">
            Notificações
          </Heading>
          {unreadCount > 0 && (
            <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs text-destructive hover:text-destructive"
            >
              Limpar todas
            </Button>
          )}
        </div>
      </div>

      {/* Lista de notificações */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <Text color="secondary">
                Nenhuma notificação no momento
              </Text>
            </motion.div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onDismiss={onDismiss}
                onMarkAsRead={onMarkAsRead}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Toast notification flutuante
interface ToastNotificationProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onDismiss,
  position = 'top-right'
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      className={cn(
        'fixed z-50 w-80',
        positionClasses[position]
      )}
    >
      <NotificationItem
        notification={notification}
        onDismiss={onDismiss}
        onMarkAsRead={() => {}}
        compact
      />
    </motion.div>
  );
};

// Hook para gerenciar notificações
export const useNotifications = () => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const addNotification = React.useCallback((
    type: NotificationType,
    category: NotificationCategory,
    title: string,
    message: string,
    actions?: Notification['actions'],
    data?: any
  ) => {
    const notification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      category,
      title,
      message,
      timestamp: new Date(),
      read: false,
      actions,
      data
    };

    setNotifications(prev => [notification, ...prev]);
    return notification.id;
  }, []);

  const dismissNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = React.useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = React.useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = React.useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    dismissNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount: notifications.filter(n => !n.read).length
  };
};