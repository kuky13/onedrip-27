import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { Enums } from '@/integrations/supabase/types';

type ServiceOrderStatus = Enums<'service_order_status'>;


export interface ContextualAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  nextStatus: string;
  description?: string;
}

export interface ServiceOrder {
  id: string;
  status: string;
  [key: string]: any;
}

export function useContextualActions() {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Definir transições válidas de status (baseado na constraint do banco)
  const validTransitions: Record<string, string[]> = {
    'opened': ['in_progress', 'cancelled'],
    'pending': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'cancelled', 'delivered'],
    'completed': ['in_progress', 'delivered'], // Permite reabrir
    'cancelled': ['opened'], // Permite reativar
    'delivered': ['completed'] // Permite reverter entrega
  };

  // Função para validar se uma transição é válida
  const isValidTransition = (currentStatus: string, nextStatus: string): boolean => {
    const normalizedCurrent = currentStatus.toLowerCase();
    const normalizedNext = nextStatus.toLowerCase();
    
    // Mapear apenas status em português para os status válidos do banco
    const statusMapping: Record<string, string> = {
      'pendente': 'pending',
      'em andamento': 'in_progress',
      'concluído': 'completed',
      'cancelado': 'cancelled'
    };

    const mappedCurrent = statusMapping[normalizedCurrent] || normalizedCurrent;
    const mappedNext = statusMapping[normalizedNext] || normalizedNext;

    return validTransitions[mappedCurrent]?.includes(mappedNext) || false;
  };


  const getAvailableActions = (currentStatus: string): ContextualAction[] => {
    const actions: ContextualAction[] = [];

    // Mapear status para ações contextuais usando os status corretos
    switch (currentStatus.toLowerCase()) {
      case 'opened':
      case 'pending':
        actions.push({
          id: 'start_service',
          label: 'Iniciar Serviço',
          icon: 'play-circle',
          color: 'bg-blue-500 hover:bg-blue-600',
          nextStatus: 'in_progress',
          description: 'Marcar como em andamento'
        });
        actions.push({
          id: 'cancel_service',
          label: 'Cancelar',
          icon: 'x-circle',
          color: 'bg-red-500 hover:bg-red-600',
          nextStatus: 'cancelled',
          description: 'Cancelar ordem de serviço'
        });
        break;

      case 'in_progress':
        actions.push({
          id: 'complete_service',
          label: 'Concluir',
          icon: 'check-circle',
          color: 'bg-green-500 hover:bg-green-600',
          nextStatus: 'completed',
          description: 'Marcar como concluído'
        });
        actions.push({
          id: 'deliver_service',
          label: 'Entregar',
          icon: 'package',
          color: 'bg-purple-500 hover:bg-purple-600',
          nextStatus: 'delivered',
          description: 'Marcar como entregue'
        });
        actions.push({
          id: 'cancel_service',
          label: 'Cancelar',
          icon: 'x-circle',
          color: 'bg-red-500 hover:bg-red-600',
          nextStatus: 'cancelled',
          description: 'Cancelar ordem de serviço'
        });
        break;

      case 'completed':
        actions.push({
          id: 'deliver_service',
          label: 'Entregar',
          icon: 'package',
          color: 'bg-purple-500 hover:bg-purple-600',
          nextStatus: 'delivered',
          description: 'Marcar como entregue'
        });
        actions.push({
          id: 'reopen_service',
          label: 'Reabrir',
          icon: 'rotate-ccw',
          color: 'bg-orange-500 hover:bg-orange-600',
          nextStatus: 'in_progress',
          description: 'Reabrir para ajustes'
        });
        break;

      case 'delivered':
        actions.push({
          id: 'revert_delivery',
          label: 'Reverter Entrega',
          icon: 'rotate-ccw',
          color: 'bg-orange-500 hover:bg-orange-600',
          nextStatus: 'completed',
          description: 'Reverter para concluído'
        });
        break;

      case 'cancelled':
        actions.push({
          id: 'reactivate_service',
          label: 'Reativar',
          icon: 'rotate-ccw',
          color: 'bg-green-500 hover:bg-green-600',
          nextStatus: 'opened',
          description: 'Reativar ordem de serviço'
        });
        break;

      default:
        // Para outros status, não há ações específicas disponíveis
        break;
    }

    return actions;
  };

  const executeAction = async (serviceOrderId: string, action: ContextualAction): Promise<boolean> => {
    try {
      setLoading(true);

      // Validar parâmetros de entrada
      if (!serviceOrderId || !action) {
        throw new Error('Parâmetros inválidos: ID da ordem de serviço e ação são obrigatórios');
      }

      if (!action.nextStatus) {
        throw new Error('Status de destino não definido para esta ação');
      }

      // Primeiro, buscar o status atual da ordem de serviço
      const { data: currentOrder, error: fetchError } = await supabase
        .from('service_orders')
        .select('status')
        .eq('id', serviceOrderId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('Ordem de serviço não encontrada');
        }
        throw new Error(`Erro ao buscar ordem de serviço: ${fetchError.message}`);
      }

      if (!currentOrder) {
        throw new Error('Ordem de serviço não encontrada');
      }

      // Validar se a transição é permitida
      if (!isValidTransition(currentOrder.status, action.nextStatus)) {
        throw new Error(`Transição de status não permitida: ${getStatusText(currentOrder.status)} → ${action.nextStatus}`);
      }

      // Usar diretamente o status da ação (já são status válidos do banco)
      const dbStatus = action.nextStatus as ServiceOrderStatus;

  // Validar se o status mapeado é válido (baseado na constraint do banco)
  const validStatuses: ServiceOrderStatus[] = ['opened', 'pending', 'in_progress', 'completed', 'cancelled', 'delivered'];
  if (!validStatuses.includes(dbStatus)) {
    throw new Error(`Status de destino inválido: ${dbStatus}`);
  }

      // Atualizar o status diretamente na tabela service_orders
      const { error: updateError } = await supabase
        .from('service_orders')
        .update({ 
          status: dbStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceOrderId);

      if (updateError) {
        if (updateError.code === '23503') {
          throw new Error('Erro de integridade: referência inválida');
        }
        if (updateError.code === '42501') {
          throw new Error('Permissão negada: você não tem autorização para esta ação');
        }
        throw new Error(`Erro ao atualizar status: ${updateError.message}`);
      }

      // Invalidar cache do React Query para atualizar a interface
      try {
        await Promise.all([
          queryClient.invalidateQueries({ 
            queryKey: ['service-orders', user?.id] 
          }),
          queryClient.invalidateQueries({ 
            queryKey: ['service-order', serviceOrderId] 
          })
        ]);
      } catch (cacheError) {
        // Log do erro de cache, mas não falha a operação
        console.warn('Erro ao invalidar cache:', cacheError);
      }

      toast.success(`${action.label} executado com sucesso!`);
      return true;
    } catch (err) {
      let errorMessage = 'Erro inesperado ao executar ação';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      }

      // Log detalhado do erro para debugging
      console.error('Erro em executeAction:', {
        serviceOrderId,
        action,
        error: err
      });

      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ServiceOrderStatus | string): string => {
    // Cores padrão para status conhecidos (baseado nos status do banco)
    switch (status.toLowerCase()) {
      case 'opened':
      case 'pending':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'in_progress':
        return 'border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'completed':
        return 'border-green-200 bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'delivered':
        return 'border-purple-200 bg-purple-50 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      case 'cancelled':
        return 'border-red-200 bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: ServiceOrderStatus | string): string => {
    // Ícones padrão para status conhecidos (baseado nos status do banco)
    switch (status.toLowerCase()) {
      case 'opened':
      case 'pending':
        return 'clock';
      case 'in_progress':
        return 'play-circle';
      case 'completed':
        return 'check-circle';
      case 'delivered':
        return 'package';
      case 'cancelled':
        return 'x-circle';
      default:
        return 'circle';
    }
  };

  const getStatusText = (status: ServiceOrderStatus | string): string => {
    // Textos padrão para status conhecidos (baseado nos status do banco)
    switch (status.toLowerCase()) {
      case 'opened':
        return 'Aberto';
      case 'pending':
        return 'Pendente';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluído';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const canExecuteAction = (serviceOrder: ServiceOrder, action: ContextualAction): boolean => {
    // Verificar se o usuário está autenticado
    if (!user) {
      return false;
    }

    // Verificar se a transição de status é válida
    if (!isValidTransition(serviceOrder.status, action.nextStatus)) {
      return false;
    }

    // Verificar permissões específicas por tipo de ação
    const restrictedActions = ['archive_service', 'delete_service'];
    if (restrictedActions.includes(action.id)) {
      // Apenas administradores podem arquivar ou deletar
      // Por enquanto, permitir para todos os usuários autenticados
      return true;
    }

    return true;
  };

  return {
    loading,
    getAvailableActions,
    executeAction,
    getStatusColor,
    getStatusIcon,
    getStatusText,
    canExecuteAction
  };
}