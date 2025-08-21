import React from 'react';
import { OptimizedNotificationPanel } from '@/components/notifications/OptimizedNotificationPanel';

interface NotificationPanelProps {
  className?: string;
  isFullPage?: boolean;
  onClose?: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  className,
  isFullPage = false,
  onClose
}) => {
  return (
    <OptimizedNotificationPanel 
      className={className}
      isFullPage={isFullPage}
      onClose={onClose}
    />
  );
};

export default NotificationPanel;