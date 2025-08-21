import React, { useState, useEffect, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, DollarSign, Truck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BudgetWorkflowStatus } from '../budgets/BudgetStatusBadge';

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

interface BudgetLiteWorkflowActionsProps {
  budget: Budget;
  onBudgetUpdate?: (updates: Partial<Budget>) => void;
  compact?: boolean;
}

export const BudgetLiteWorkflowActions = memo(({ budget, onBudgetUpdate, compact = false }: BudgetLiteWorkflowActionsProps) => {
  const { toast } = useToast();
  const [localBudget, setLocalBudget] = useState<Budget>(budget);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sincronizar estado local com prop budget
  useEffect(() => {
    setLocalBudget(budget);
  }, [budget]);

  // Feedback tátil para iOS
  const hapticFeedback = useCallback(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50); // Vibração sutil
    }
  }, []);

  const updateBudget = useCallback(async (updates: Partial<Budget>) => {
    try {
      setIsUpdating(true);
      hapticFeedback();
      
      // Atualização otimista local
      const optimisticBudget = { ...localBudget, ...updates };
      setLocalBudget(optimisticBudget);
      onBudgetUpdate?.(updates);

      // Fetch com timeout para iOS
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      try {
        const response = await fetch(
          `https://oghjlypdnmqecaavekyr.supabase.co/rest/v1/budgets?id=eq.${budget.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naGpseXBkbm1xZWNhYXZla3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTI3NTcsImV4cCI6MjA2MTUyODc1N30.aor71Dj3pcEa7N82vGdW5MlciiNnl1ISqAimEyPbbJY',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(updates),
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        toast({
          title: 'Orçamento atualizado!',
          description: 'O status do orçamento foi atualizado com sucesso.',
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      // Reverter atualização otimista em caso de erro
      setLocalBudget(budget);
      
      const isAbortError = error instanceof Error && error.name === 'AbortError';
      toast({
        title: 'Erro ao atualizar',
        description: isAbortError 
          ? 'Operação cancelada por timeout. Verifique sua conexão.' 
          : 'Não foi possível atualizar o orçamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [localBudget, budget, onBudgetUpdate, toast, hapticFeedback]);

  const handleApprove = useCallback(() => {
    updateBudget({
      workflow_status: 'approved',
      approved_at: new Date().toISOString(),
    });
  }, [updateBudget]);

  const handleMarkPaid = useCallback(() => {
    updateBudget({
      is_paid: true,
      payment_confirmed_at: new Date().toISOString(),
    });
  }, [updateBudget]);

  const handleMarkDelivered = useCallback(() => {
    updateBudget({
      is_delivered: true,
      delivery_confirmed_at: new Date().toISOString(),
    });
  }, [updateBudget]);

  const handleComplete = useCallback(() => {
    updateBudget({
      workflow_status: 'completed',
      is_paid: true,
      is_delivered: true,
      payment_confirmed_at: localBudget.payment_confirmed_at || new Date().toISOString(),
      delivery_confirmed_at: new Date().toISOString(),
    });
  }, [updateBudget, localBudget.payment_confirmed_at]);

  const getAvailableActions = useCallback(() => {
    const actions = [];

    if (localBudget.workflow_status === 'pending') {
      actions.push({
        key: 'approve',
        label: 'Aprovar',
        icon: CheckCircle,
        onClick: handleApprove,
        variant: 'default' as const,
        className: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-700'
      });
    }

    if (localBudget.workflow_status === 'approved' && !localBudget.is_paid) {
      actions.push({
        key: 'pay',
        label: 'Pago',
        icon: DollarSign,
        onClick: handleMarkPaid,
        variant: 'default' as const,
        className: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700'
      });
    }

    if (localBudget.workflow_status === 'approved' && localBudget.is_paid && !localBudget.is_delivered) {
      actions.push({
        key: 'deliver',
        label: 'Entregue',
        icon: Truck,
        onClick: handleMarkDelivered,
        variant: 'default' as const,
        className: 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700'
      });
    }

    if (localBudget.workflow_status !== 'completed' && localBudget.workflow_status === 'approved') {
      actions.push({
        key: 'complete',
        label: 'Concluir',
        icon: CheckCircle,
        onClick: handleComplete,
        variant: 'default' as const,
        className: 'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700'
      });
    }

    return actions;
  }, [localBudget, handleApprove, handleMarkPaid, handleMarkDelivered, handleComplete]);

  const actions = getAvailableActions();

  if (actions.length === 0) {
    return null;
  }

  return (
    <div 
      className="flex flex-col gap-3 w-full"
      style={{
        // Otimizações iOS para performance
        transform: 'translateZ(0)',
        WebkitBackfaceVisibility: 'hidden',
        WebkitTransform: 'translate3d(0,0,0)'
      }}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.key}
            variant={action.variant}
            size="sm"
            onClick={action.onClick}
            disabled={isUpdating}
            className={`
              w-full justify-start text-sm font-medium
              min-h-[48px] px-4 py-3
              touch-manipulation cursor-pointer
              transition-all duration-200 ease-out
              ${action.className}
              ${compact ? 'min-h-[44px] px-3 py-2 text-xs' : ''}
              ${isUpdating ? 'opacity-75 cursor-not-allowed' : ''}
            `}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 flex-shrink-0 animate-spin" />
            ) : (
              <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
            )}
            <span className="truncate font-medium">{action.label}</span>
          </Button>
        );
      })}
    </div>
  );
});

BudgetLiteWorkflowActions.displayName = 'BudgetLiteWorkflowActions';