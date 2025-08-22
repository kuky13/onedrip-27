import React, { useState, useEffect } from 'react';
import { MessageCircle, FileText, Edit, Trash2, RefreshCw } from 'lucide-react';
import { BudgetLiteStatusBadge } from './BudgetLiteStatusBadge';
import { BudgetLiteWorkflowActions } from './BudgetLiteWorkflowActions';
import { BudgetLiteActionDialog } from './BudgetLiteActionDialog';
import { MiniToastWithArrow } from './MiniToastWithArrow';
import { useIOSRefresh } from '@/hooks/useIOSRefresh';
interface BudgetLiteCardProps {
  budget: any;
  profile: any;
  onShareWhatsApp: (budget: any) => void;

  onEdit: (budget: any) => void;
  onDelete: (budget: any) => void;
  onRefresh?: () => void;
  isGenerating?: boolean;
  isDeleting?: boolean;
}
export const BudgetLiteCard = ({
  budget,
  profile,
  onShareWhatsApp,

  onEdit,
  onDelete,
  onRefresh,
  isGenerating = false,
  isDeleting = false
}: BudgetLiteCardProps) => {
  const [localBudget, setLocalBudget] = useState(budget);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'whatsapp' | 'pdf' | 'delete' | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    type: null,
    isLoading: false
  });
  const [showToast, setShowToast] = useState(false);
  const {
    isRefreshing,
    refreshBudgetData
  } = useIOSRefresh({
    budgetId: budget?.id,
    onRefreshComplete: updatedBudget => {
      handleBudgetUpdate(updatedBudget);
    }
  });

  // Sincronizar estado local com prop budget
  useEffect(() => {
    setLocalBudget(budget);
  }, [budget]);
  if (!localBudget || !localBudget.id || localBudget.deleted_at) {
    return null;
  }
  const handleBudgetUpdate = (updates: any) => {
    setLocalBudget((prev: any) => ({
      ...prev,
      ...updates
    }));
  };
  const openDialog = (type: 'whatsapp' | 'pdf' | 'delete') => {
    setDialogState({
      isOpen: true,
      type,
      isLoading: false
    });
  };
  const closeDialog = () => {
    setDialogState({
      isOpen: false,
      type: null,
      isLoading: false
    });
  };
  const handleConfirmAction = async () => {
    if (!dialogState.type) return;
    setDialogState(prev => ({
      ...prev,
      isLoading: true
    }));
    try {
      switch (dialogState.type) {
        case 'whatsapp':
          await onShareWhatsApp(localBudget);
          break;

        case 'delete':
          await onDelete(budget);
          break;
      }
      closeDialog();
      // Show toast after action
      setShowToast(true);
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      setDialogState(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  };
  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  return <div className="relative border border-gray-700 rounded-xl p-4 mb-3 bg-black/[0.31]">
      {/* Refresh Button */}
      <button 
        onClick={refreshBudgetData} 
        disabled={isRefreshing} 
        style={{ 
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10
        }} 
        aria-label="Atualizar dados do orçamento" 
        className="p-2 bg-blue-500/20 active:bg-blue-500/40 text-blue-400 border border-blue-400/30 transition-colors duration-200 disabled:opacity-50 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>

      {/* Mini Toast */}
      <MiniToastWithArrow show={showToast} message="Dados atualizados! ↗️" onClose={() => setShowToast(false)} />

      {/* Header */}
      <div className="flex justify-between items-start mb-3 pr-12">
        <div>
          <h3 className="font-bold text-xl text-white">
            {budget.device_model || 'Dispositivo não informado'}
          </h3>
          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-md mt-1 inline-block">
            {budget.device_type || 'Tipo não informado'}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {budget.created_at ? formatDate(budget.created_at) : 'Data não informada'}
        </span>
      </div>

      {/* Client Info */}
      {budget.client_name && <div className="mb-3">
          <p className="text-sm text-yellow-400 font-medium">
            Cliente: {budget.client_name}
          </p>
        </div>}

      {/* Status Badge - Advanced Features */}
      {profile?.advanced_features_enabled && <div className="mb-3">
          <BudgetLiteStatusBadge status={localBudget.workflow_status || 'pending'} isPaid={localBudget.is_paid || false} isDelivered={localBudget.is_delivered || false} expiresAt={localBudget.expires_at} />
        </div>}

      {/* Service/Issue */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 font-medium mb-1">Serviço:</p>
        <p className="text-white">{localBudget.issue || 'Problema não informado'}</p>
        <div className="w-full h-px bg-gray-700 mt-3"></div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <p className="text-2xl font-bold text-white">
          {formatPrice(localBudget.total_price || 0)}
        </p>
        {localBudget.installments > 1 && <p className="text-sm text-gray-400">
            {localBudget.installments}x
          </p>}
        <div className="w-full h-px bg-gray-700 mt-3"></div>
      </div>

      {/* Workflow Actions Section */}
      {profile?.advanced_features_enabled && <div className="mb-4">
          <p className="text-sm text-gray-400 font-medium mb-2">Ações:</p>
          <BudgetLiteWorkflowActions budget={{
        id: localBudget.id,
        workflow_status: localBudget.workflow_status || 'pending',
        is_paid: localBudget.is_paid || false,
        is_delivered: localBudget.is_delivered || false,
        expires_at: localBudget.expires_at,
        approved_at: localBudget.approved_at,
        payment_confirmed_at: localBudget.payment_confirmed_at,
        delivery_confirmed_at: localBudget.delivery_confirmed_at
      }} onBudgetUpdate={handleBudgetUpdate} />
        </div>}

      {/* Action Icons */}
      <div className="flex justify-center gap-8 pt-4">
        <button onClick={() => openDialog('whatsapp')} className="flex flex-col items-center gap-1 text-green-400 hover:text-green-300 transition-colors">
          <MessageCircle className="h-6 w-6" />
        </button>
        
        <button onClick={() => openDialog('pdf')} disabled={isGenerating} className="flex flex-col items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50">
          <FileText className="h-6 w-6" />
        </button>
        
        <button onClick={() => onEdit(budget)} className="flex flex-col items-center gap-1 text-yellow-400 hover:text-yellow-300 transition-colors">
          <Edit className="h-6 w-6" />
        </button>
        
        <button onClick={() => openDialog('delete')} disabled={isDeleting} className="flex flex-col items-center gap-1 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50">
          <Trash2 className="h-6 w-6" />
        </button>
      </div>

      {/* Confirmation Dialog */}
      <BudgetLiteActionDialog isOpen={dialogState.isOpen} onClose={closeDialog} onConfirm={handleConfirmAction} type={dialogState.type!} deviceModel={budget.device_model} clientName={budget.client_name} isLoading={dialogState.isLoading} />
    </div>;
};