
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, DollarSign, Truck } from 'lucide-react';
import { useLayout } from '@/contexts/LayoutContext';
import { cn } from '@/lib/utils';

export type BudgetWorkflowStatus = 'pending' | 'approved' | 'completed';

interface BudgetStatusBadgeProps {
  status: BudgetWorkflowStatus;
  isPaid?: boolean;
  isDelivered?: boolean;
  expiresAt?: string | null;
  className?: string;
}

export const BudgetStatusBadge = ({ 
  status, 
  isPaid = false, 
  isDelivered = false, 
  expiresAt,
  className 
}: BudgetStatusBadgeProps) => {
  const { isMobile, isTablet } = useLayout();
  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  // Tamanhos responsivos
  const getIconSize = () => {
    if (isMobile) return "h-3 w-3";
    return "h-3 w-3";
  };

  const getBadgeSize = () => {
    if (isMobile) return "text-xs px-2 py-1";
    return "text-xs px-2.5 py-1";
  };

  // Priority: Expired > Status > Payment/Delivery
  if (isExpired && status === 'pending') {
    return (
      <Badge 
        variant="destructive" 
        className={cn(
          "flex items-center gap-1.5 font-medium",
          getBadgeSize(),
          className
        )}
      >
        <XCircle className={getIconSize()} />
        Vencido
      </Badge>
    );
  }

  switch (status) {
    case 'pending':
      return (
        <Badge 
          variant="secondary" 
          className={cn(
            "bg-amber-100 text-amber-800 hover:bg-amber-200 flex items-center gap-1.5 font-medium border-amber-200",
            getBadgeSize(),
            className
          )}
        >
          <Clock className={getIconSize()} />
          Pendente
        </Badge>
      );
    case 'approved':
      if (!isPaid) {
        return (
          <Badge 
            variant="secondary" 
            className={cn(
              "bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1.5 font-medium border-blue-200",
              getBadgeSize(),
              className
            )}
          >
            <DollarSign className={getIconSize()} />
            Aprovado
          </Badge>
        );
      }
      if (!isDelivered) {
        return (
          <Badge 
            variant="secondary" 
            className={cn(
              "bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1.5 font-medium border-green-200",
              getBadgeSize(),
              className
            )}
          >
            <Truck className={getIconSize()} />
            Pago
          </Badge>
        );
      }
      return (
        <Badge 
          variant="secondary" 
          className={cn(
            "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 flex items-center gap-1.5 font-medium border-emerald-200",
            getBadgeSize(),
            className
          )}
        >
          <CheckCircle className={getIconSize()} />
          Entregue
        </Badge>
      );
    case 'completed':
      return (
        <Badge 
          variant="secondary" 
          className={cn(
            "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 flex items-center gap-1.5 font-medium border-emerald-200",
            getBadgeSize(),
            className
          )}
        >
          <CheckCircle className={getIconSize()} />
          Concluído
        </Badge>
      );
    default:
      return (
        <Badge 
          variant="outline" 
          className={cn(
            "flex items-center gap-1.5 font-medium",
            getBadgeSize(),
            className
          )}
        >
          <Clock className={getIconSize()} />
          Pendente
        </Badge>
      );
  }
};

export const getBudgetStatusInfo = (
  status: BudgetWorkflowStatus,
  isPaid: boolean = false,
  isDelivered: boolean = false,
  expiresAt?: string | null
) => {
  const isExpired = expiresAt && new Date(expiresAt) < new Date();
  
  if (isExpired && status === 'pending') {
    return {
      label: 'Vencido',
      color: 'destructive',
      icon: XCircle,
      priority: 1
    };
  }

  switch (status) {
    case 'pending':
      return {
        label: 'Pendente',
        color: 'amber',
        icon: Clock,
        priority: 2
      };
    case 'approved':
      if (!isPaid) {
        return {
          label: 'Aprovado',
          color: 'blue',
          icon: DollarSign,
          priority: 3
        };
      }
      if (!isDelivered) {
        return {
          label: 'Pago',
          color: 'green',
          icon: Truck,
          priority: 4
        };
      }
      return {
        label: 'Entregue',
        color: 'emerald',
        icon: CheckCircle,
        priority: 5
      };
    case 'completed':
      return {
        label: 'Concluído',
        color: 'emerald',
        icon: CheckCircle,
        priority: 6
      };
    default:
      return {
        label: 'Pendente',
        color: 'outline',
        icon: Clock,
        priority: 2
      };
  }
};
