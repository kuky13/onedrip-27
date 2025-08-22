import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface NotificationIndicatorProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  iconOnly?: boolean;
}

export const NotificationIndicator: React.FC<NotificationIndicatorProps> = ({
  className,
  size = 'default',
  iconOnly = true,
}) => {
  const navigate = useNavigate();

  const buttonSizes = {
    sm: 'h-8 w-8',
    default: 'h-9 w-9',
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/msg');
  };

  return (
    <Button
      variant="ghost"
      size={iconOnly ? 'icon' : size}
      className={cn(
        'relative transition-all duration-300 ease-out group',
        iconOnly && buttonSizes[size],
        'hover:bg-muted/50',
        'hover:scale-105',
        'hover:shadow-md',
        className
      )}
      onClick={handleClick}
    >
      <Bell className={cn(
        iconSizes[size],
        'transition-transform duration-200',
        'group-hover:scale-110'
      )} />
      
      {!iconOnly && (
        <span className="ml-2 font-medium">
          Mensagens
        </span>
      )}
    </Button>
  );
};

// Componente simplificado para uso em mobile
export const NotificationIndicatorMobile: React.FC<{
  onClick?: () => void;
  className?: string;
}> = ({ onClick, className }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/msg');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'relative h-9 w-9 transition-all duration-200',
        'hover:bg-muted/50 hover:scale-105',
        className
      )}
      onClick={handleClick}
    >
      <Bell className="h-5 w-5" />
    </Button>
  );
};