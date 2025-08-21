import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useContextualActions } from '@/hooks/useContextualActions';
import { toast } from 'sonner';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  User, 
  Package, 
  RotateCcw, 
  XCircle,
  Loader2
} from 'lucide-react';

interface ServiceOrder {
  id: string;
  status: string;
  [key: string]: any;
}

interface ServiceOrderStatusActionsProps {
  serviceOrder: ServiceOrder;
  onStatusUpdate?: (newStatus: string) => Promise<void>;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  'play-circle': Play,
  'check-circle': CheckCircle,
  'clock': Clock,
  'user-clock': User,
  'package': Package,
  'rotate-ccw': RotateCcw,
  'x-circle': XCircle,
};

export const ServiceOrderStatusActions: React.FC<ServiceOrderStatusActionsProps> = ({
  serviceOrder,
  onStatusUpdate
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  const {
    getAvailableActions,
    executeAction,
    getStatusText
  } = useContextualActions();

  const availableActions = getAvailableActions(serviceOrder.status);

  const handleActionClick = async (action: any) => {
    if (!serviceOrder.id) {
      toast.error('ID da ordem de serviço não encontrado');
      return;
    }

    setLoadingAction(action.id);
    
    try {
      const success = await executeAction(serviceOrder.id, action);
      
      if (success) {
        toast.success(`Status atualizado para: ${getStatusText(action.nextStatus)}`);
        
        // Atualizar status localmente se callback fornecido
        if (onStatusUpdate) {
          await onStatusUpdate(action.nextStatus);
        }
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      toast.error('Erro inesperado ao executar ação');
    } finally {
      setLoadingAction(null);
    }
  };

  if (availableActions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Nenhuma ação disponível para o status atual
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableActions.map((action) => {
        const Icon = iconMap[action.icon] || CheckCircle;
        const isLoading = loadingAction === action.id;
        
        return (
          <Button
            key={action.id}
            size="sm"
            disabled={isLoading}
            onClick={() => handleActionClick(action)}
            className="flex items-center gap-2"
            variant={action.color.includes('red') ? 'destructive' : 'default'}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
};

export default ServiceOrderStatusActions;