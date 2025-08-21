import React, { useState } from 'react';
import { generateWhatsAppMessage, shareViaWhatsApp } from '@/utils/whatsappUtils';
import { MessageCircle, FileText, Edit, Trash2, Eye, Share } from 'lucide-react';
import { BudgetLiteStatusBadge } from './BudgetLiteStatusBadge';
import { BudgetLiteWorkflowActions } from './BudgetLiteWorkflowActions';
import { BudgetEditFormIOS } from './BudgetEditFormIOS';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { supabase } from '@/integrations/supabase/client';
import { useShopProfile } from '@/hooks/useShopProfile';
import { useIOSFeedback } from './IOSFeedback';

interface Budget {
  id: string;
  client_name?: string;
  device_model?: string;
  device_type?: string;
  issue?: string;
  total_price?: number;
  cash_price?: number;
  installment_price?: number;
  part_quality?: string;
  part_type?: string;
  workflow_status?: string;
  is_paid?: boolean;
  is_delivered?: boolean;
  expires_at?: string;
  approved_at?: string;
  payment_confirmed_at?: string;
  delivery_confirmed_at?: string;
  created_at: string;
  installments?: number;
}
interface BudgetLiteCardiOSProps {
  budget: Budget;
  profile: any;
  onShareWhatsApp: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
  onBudgetUpdate?: (updates: Partial<Budget>) => void;
}
export const BudgetLiteCardiOS = ({
  budget,
  profile,
  onShareWhatsApp,
  onDelete,
  onBudgetUpdate
}: BudgetLiteCardiOSProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const {
    shopProfile
  } = useShopProfile();
  const {
    hapticFeedback,
    showSuccessAction,
    showErrorAction,
    showProgressAction
  } = useIOSFeedback();
  if (!budget || !budget.id) {
    return null;
  }
  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(budget.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };
  const handleWhatsAppShare = async () => {
    if (isSharing) return;
    try {
      setIsSharing(true);
      hapticFeedback('light');
      showProgressAction('Preparando mensagem...');

      // Buscar dados completos do orçamento
      const {
        data: fullBudget,
        error
      } = await supabase.from('budgets').select('*').eq('id', budget.id).single();
      if (error) {
        console.error('Erro ao buscar orçamento:', error);
        // Fallback com dados básicos
        const message = generateWhatsAppMessage({
          id: budget.id,
          device_model: budget.device_model || 'Dispositivo',
          device_type: budget.device_type || 'Smartphone',
          part_type: budget.part_type || 'Reparo',
          part_quality: budget.part_quality || 'Reparo geral',
          cash_price: budget.total_price || 0,
          installment_price: budget.total_price || 0,
          installments: budget.installments || 1,
          total_price: budget.total_price || 0,
          warranty_months: 3,
          payment_condition: 'Cartão de Crédito',
          includes_delivery: false,
          includes_screen_protector: false,
          status: 'pending',
          workflow_status: budget.workflow_status || 'pending',
          created_at: budget.created_at,
          valid_until: budget.expires_at || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        });
        shareViaWhatsApp(message);
        showSuccessAction('Redirecionando para WhatsApp');
        return;
      }

      // Usar dados completos do banco
      const message = generateWhatsAppMessage({
        id: fullBudget.id,
        device_model: fullBudget.device_model || 'Dispositivo',
        device_type: fullBudget.device_type || 'Smartphone',
        part_type: fullBudget.part_type || 'Reparo',
        part_quality: fullBudget.part_quality || fullBudget.part_type || 'Reparo geral',
        cash_price: fullBudget.cash_price || fullBudget.total_price || 0,
        installment_price: fullBudget.installment_price || fullBudget.total_price || 0,
        installments: fullBudget.installments || 1,
        total_price: fullBudget.total_price || 0,
        warranty_months: fullBudget.warranty_months || 3,
        payment_condition: fullBudget.payment_condition || 'Cartão de Crédito',
        includes_delivery: fullBudget.includes_delivery || false,
        includes_screen_protector: fullBudget.includes_screen_protector || false,
        delivery_date: fullBudget.delivery_date,
        notes: fullBudget.notes,
        status: fullBudget.status || 'pending',
        workflow_status: fullBudget.workflow_status || 'pending',
        created_at: fullBudget.created_at,
        valid_until: fullBudget.valid_until || fullBudget.expires_at || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: fullBudget.expires_at
      });
      shareViaWhatsApp(message);
      showSuccessAction('Redirecionando para WhatsApp');
    } catch (error) {
      console.error('Erro ao compartilhar WhatsApp:', error);
      showErrorAction('Não foi possível compartilhar');
    } finally {
      setIsSharing(false);
    }
  };

  return <div className="bg-card border border-border rounded-2xl p-5 shadow-soft transition-all duration-200 active:scale-[0.98]" style={{
    // Otimizações para performance no iOS
    transform: 'translateZ(0)',
    WebkitBackfaceVisibility: 'hidden',
    WebkitTransform: 'translate3d(0,0,0)'
  }}>
      {/* Header Completo */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          
          
        </div>
        
      </div>

      {/* Status Badge - Advanced Features */}
      {profile?.advanced_features_enabled && <div className="mb-4">
          <BudgetLiteStatusBadge status={budget.workflow_status as any || 'pending'} isPaid={budget.is_paid || false} isDelivered={budget.is_delivered || false} expiresAt={budget.expires_at} />
        </div>}

      {/* Detalhes Completos do Orçamento */}
      <div className="space-y-3 mb-5">
        {/* Serviço/Problema */}
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground font-medium mb-1">Serviço/Dispositivo:</p>
          <p className="text-card-foreground leading-relaxed font-medium">
            {budget.device_model || 'Dispositivo não informado'}
          </p>
        </div>

        {/* Informações do Dispositivo */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">QUALIDADE:</p>
            <p className="text-sm text-card-foreground font-medium">
              {budget.part_quality || budget.part_type || 'Não informado'}
            </p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">APARELHO:</p>
            <p className="text-sm text-card-foreground font-medium">
              {budget.device_type || 'Não informado'}
            </p>
          </div>
        </div>

        {/* Cliente */}
        {budget.client_name && <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">CLIENTE:</p>
            <p className="text-sm text-card-foreground font-medium">
              {budget.client_name}
            </p>
          </div>}

        {/* Preço e Parcelamento */}
        <div className="bg-primary/5 rounded-xl border border-primary/10 p-4">
          <div className="space-y-3">
            {/* Valor à vista */}
            <div>
              <p className="text-xs text-primary/70 font-medium mb-1">VALOR À VISTA:</p>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(budget.cash_price || budget.total_price || 0)}
              </p>
            </div>
            
            {/* Valor parcelado - só aparece se houver parcelamento */}
            {budget.installments && budget.installments > 1 && budget.installment_price && <div className="pt-2 border-t border-primary/10">
                <p className="text-xs text-primary/70 font-medium mb-1">VALOR PARCELADO:</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-bold text-primary">
                    {formatPrice(budget.installment_price)}
                  </p>
                  <p className="text-sm text-primary/70">
                    em {budget.installments}x
                  </p>
                </div>
              </div>}
          </div>
        </div>

        {/* Status de Pagamento e Entrega */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">PAGAMENTO:</p>
            <p className={`text-sm font-medium ${budget.is_paid ? 'text-green-600' : 'text-orange-600'}`}>
              {budget.is_paid ? 'PAGO' : 'PENDENTE'}
            </p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">ENTREGA:</p>
            <p className={`text-sm font-medium ${budget.is_delivered ? 'text-green-600' : 'text-orange-600'}`}>
              {budget.is_delivered ? 'ENTREGUE' : 'PENDENTE'}
            </p>
          </div>
        </div>

        {/* Datas Importantes */}
        <div className="space-y-2">
          {budget.expires_at && <div className="bg-muted/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground font-medium mb-1">EXPIRA EM:</p>
              <p className="text-sm text-card-foreground font-medium">
                {formatDate(budget.expires_at)}
              </p>
            </div>}
        </div>
      </div>

      {/* Workflow Actions Section */}
      {profile?.advanced_features_enabled && <div className="mb-6">
          <p className="text-sm text-muted-foreground font-medium mb-3">Ações:</p>
          <BudgetLiteWorkflowActions budget={{
        id: budget.id,
        workflow_status: budget.workflow_status as any || 'pending',
        is_paid: budget.is_paid || false,
        is_delivered: budget.is_delivered || false,
        expires_at: budget.expires_at,
        approved_at: budget.approved_at,
        payment_confirmed_at: budget.payment_confirmed_at,
        delivery_confirmed_at: budget.delivery_confirmed_at
      }} onBudgetUpdate={onBudgetUpdate} />
        </div>}

      {/* Action Buttons - Diretas e intuitivas para iOS */}
      <div className="flex justify-center pt-4">
        {/* WhatsApp - Ação direta */}
        <button 
          onClick={handleWhatsAppShare} 
          disabled={false}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 active:scale-95" 
          style={{
            minHeight: '48px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <MessageCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">Compartilhar no WhatsApp</span>
        </button>
      </div>

      {/* Secondary Actions - Compactas */}
      <div className="flex justify-center gap-4 pt-3">
        <button onClick={handleEdit} className="flex items-center gap-2 text-muted-foreground hover:text-accent py-2 px-3 rounded-lg hover:bg-muted/50 transition-all duration-200" style={{
        minHeight: '40px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}>
          <Edit className="h-4 w-4" />
          <span className="text-sm">Editar</span>
        </button>
        
        {/* Delete com Confirmação mínima */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-destructive py-2 px-3 rounded-lg hover:bg-muted/50 transition-all duration-200" style={{
            minHeight: '40px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }} disabled={isDeleting}>
              <Trash2 className="h-4 w-4" />
              <span className="text-sm">Excluir</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-sm mx-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg">Excluir?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Este orçamento será movido para a lixeira.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-3">
              <AlertDialogCancel className="flex-1">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Modal de Edição */}
      <BudgetEditFormIOS budget={budget} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onBudgetUpdate={onBudgetUpdate} />
    </div>;
};