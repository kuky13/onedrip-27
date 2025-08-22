
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, DollarSign, Truck, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BudgetWorkflowStatus } from './BudgetStatusBadge';
import { useLayout } from '@/contexts/LayoutContext';
import { cn } from '@/lib/utils';

interface Budget {
  id: string;
  workflow_status: BudgetWorkflowStatus;
  is_paid: boolean;
  is_delivered: boolean;
  expires_at?: string | null;
  approved_at?: string | null;
  payment_confirmed_at?: string | null;
  delivery_confirmed_at?: string | null;
}

interface BudgetWorkflowActionsProps {
  budget: Budget;
  compact?: boolean;
}

export const BudgetWorkflowActions = ({ budget, compact = false }: BudgetWorkflowActionsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMobile, isTablet } = useLayout();

  const updateBudgetMutation = useMutation({
    mutationFn: async (updates: Partial<Budget>) => {
      const { error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', budget.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: 'Orçamento atualizado!',
        description: 'O status do orçamento foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error updating budget:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o orçamento. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const handleApprove = () => {
    updateBudgetMutation.mutate({
      workflow_status: 'approved',
      approved_at: new Date().toISOString(),
    });
  };

  const handleMarkPaid = () => {
    updateBudgetMutation.mutate({
      is_paid: true,
      payment_confirmed_at: new Date().toISOString(),
    });
  };

  const handleMarkDelivered = () => {
    updateBudgetMutation.mutate({
      is_delivered: true,
      delivery_confirmed_at: new Date().toISOString(),
    });
  };

  const handleComplete = () => {
    updateBudgetMutation.mutate({
      workflow_status: 'completed',
      is_paid: true,
      is_delivered: true,
      payment_confirmed_at: budget.payment_confirmed_at || new Date().toISOString(),
      delivery_confirmed_at: new Date().toISOString(),
    });
  };

  const getAvailableActions = () => {
    const actions = [];

    if (budget.workflow_status === 'pending') {
      actions.push({
        key: 'approve',
        label: isMobile ? 'Aprovar' : 'Aprovar',
        icon: CheckCircle,
        onClick: handleApprove,
        variant: 'default' as const,
        color: 'bg-green-600 hover:bg-green-700 text-white'
      });
    }

    if (budget.workflow_status === 'approved' && !budget.is_paid) {
      actions.push({
        key: 'pay',
        label: isMobile ? 'Pago' : 'Marcar como Pago',
        icon: DollarSign,
        onClick: handleMarkPaid,
        variant: 'default' as const,
        color: 'bg-blue-600 hover:bg-blue-700 text-white'
      });
    }

    if (budget.workflow_status === 'approved' && budget.is_paid && !budget.is_delivered) {
      actions.push({
        key: 'deliver',
        label: isMobile ? 'Entregue' : 'Marcar como Entregue',
        icon: Truck,
        onClick: handleMarkDelivered,
        variant: 'default' as const,
        color: 'bg-purple-600 hover:bg-purple-700 text-white'
      });
    }

    if (budget.workflow_status !== 'completed' && budget.workflow_status === 'approved') {
      actions.push({
        key: 'complete',
        label: isMobile ? 'Concluir' : 'Concluir Serviço',
        icon: CheckCircle,
        onClick: handleComplete,
        variant: 'secondary' as const,
        color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
      });
    }

    return actions;
  };

  const actions = getAvailableActions();

  if (actions.length === 0) {
    return null;
  }

  // Mobile: Stack vertically with full width
  if (isMobile) {
    return (
      <div className="flex flex-col gap-2 w-full mt-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.key}
              size="sm"
              onClick={action.onClick}
              disabled={updateBudgetMutation.isPending}
              className={cn(
                "w-full justify-start text-sm h-8",
                action.color
              )}
            >
              <Icon className="h-3.5 w-3.5 mr-2" />
              {action.label}
            </Button>
          );
        })}
      </div>
    );
  }

  // Tablet/Desktop: Horizontal layout
  return (
    <div className={cn(
      "flex gap-1 flex-wrap",
      compact ? "flex-col" : "flex-row"
    )}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.key}
            variant={action.variant}
            size={compact || isTablet ? 'sm' : 'default'}
            onClick={action.onClick}
            disabled={updateBudgetMutation.isPending}
            className={cn(
              compact ? 'w-full justify-start text-xs h-7' : 'text-sm',
              action.color
            )}
          >
            <Icon className="h-3.5 w-3.5 mr-1.5" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
};
