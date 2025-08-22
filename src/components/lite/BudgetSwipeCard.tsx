import React, { useState, useRef, useCallback } from 'react';
import { MessageCircle, FileText, Edit, Trash2, Check, X as XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BudgetLiteStatusBadge } from './BudgetLiteStatusBadge';
import { useIOSFeedback } from './IOSFeedback';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Budget {
  id: string;
  client_name?: string;
  device_model?: string;
  device_type?: string;
  issue?: string;
  total_price?: number;
  workflow_status?: string;
  is_paid?: boolean;
  is_delivered?: boolean;
  expires_at?: string;
  created_at: string;
  installments?: number;
}

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
  side: 'left' | 'right';
}

interface BudgetSwipeCardProps {
  budget: Budget;
  profile: any;
  onShareWhatsApp: (budget: Budget) => void;
  onViewPDF: (budget: Budget) => void;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
  onBudgetUpdate?: (updates: Partial<Budget>) => void;
}

export const BudgetSwipeCard = ({
  budget,
  profile,
  onShareWhatsApp,
  onViewPDF,
  onEdit,
  onDelete,
  onBudgetUpdate
}: BudgetSwipeCardProps) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const { hapticFeedback, showSuccessAction, showErrorAction } = useIOSFeedback();

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Swipe Actions Configuration
  const leftActions: SwipeAction[] = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: <MessageCircle className="h-5 w-5" />,
      color: 'bg-green-500',
      action: () => {
        hapticFeedback('light');
        onShareWhatsApp(budget);
        showSuccessAction('Redirecionando para WhatsApp');
      },
      side: 'left'
    },
    {
      id: 'pdf',
      label: 'PDF',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-blue-500',
      action: () => {
        hapticFeedback('light');
        onViewPDF(budget);
      },
      side: 'left'
    }
  ];

  const rightActions: SwipeAction[] = [
    {
      id: 'edit',
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      color: 'bg-yellow-500',
      action: () => {
        hapticFeedback('light');
        onEdit(budget);
      },
      side: 'right'
    },
    {
      id: 'delete',
      label: 'Excluir',
      icon: <Trash2 className="h-4 w-4" />,
      color: 'bg-red-500',
      action: () => {
        hapticFeedback('medium');
        setShowDeleteConfirm(true);
      },
      side: 'right'
    }
  ];

  // Touch/Mouse Handlers
  const handleStart = useCallback((clientX: number) => {
    setIsDragging(true);
    startXRef.current = clientX;
    hapticFeedback('light');
  }, [hapticFeedback]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - startXRef.current;
    const maxSwipe = 120; // Maximum swipe distance
    const constrainedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
    
    setDragX(constrainedDelta);
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    
    const threshold = 60; // Threshold to trigger action
    const absX = Math.abs(dragX);
    
    if (absX > threshold) {
      if (dragX > 0) {
        // Swiped right - trigger first left action (WhatsApp)
        leftActions[0]?.action();
      } else {
        // Swiped left - trigger first right action (Edit)
        rightActions[0]?.action();
      }
      hapticFeedback('medium');
    }
    
    // Reset
    setDragX(0);
    setIsDragging(false);
  }, [isDragging, dragX, leftActions, rightActions, hapticFeedback]);

  // Mouse Events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch Events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const handleDeleteConfirm = () => {
    onDelete(budget.id);
    setShowDeleteConfirm(false);
    hapticFeedback('heavy');
    showSuccessAction('Orçamento excluído');
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-soft">
      {/* Background Actions */}
      {isDragging && (
        <>
          {/* Left Actions Background */}
          {dragX > 0 && (
            <div className="absolute inset-y-0 left-0 flex items-center">
              {leftActions.map((action, index) => {
                const actionWidth = 80;
                const offset = index * actionWidth;
                const progress = Math.min(dragX / (actionWidth * (index + 1)), 1);
                
                return (
                  <div
                    key={action.id}
                    className={cn(
                      "flex items-center justify-center text-white transition-all duration-200",
                      action.color
                    )}
                    style={{
                      width: `${actionWidth}px`,
                      height: '100%',
                      opacity: progress,
                      transform: `translateX(${offset}px) scale(${0.8 + progress * 0.2})`
                    }}
                  >
                    <div className="text-center">
                      {action.icon}
                      <div className="text-xs mt-1 font-medium">{action.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Right Actions Background */}
          {dragX < 0 && (
            <div className="absolute inset-y-0 right-0 flex items-center">
              {rightActions.map((action, index) => {
                const actionWidth = 80;
                const offset = index * actionWidth;
                const progress = Math.min(Math.abs(dragX) / (actionWidth * (index + 1)), 1);
                
                return (
                  <div
                    key={action.id}
                    className={cn(
                      "flex items-center justify-center text-white transition-all duration-200",
                      action.color
                    )}
                    style={{
                      width: `${actionWidth}px`,
                      height: '100%',
                      opacity: progress,
                      transform: `translateX(-${offset}px) scale(${0.8 + progress * 0.2})`
                    }}
                  >
                    <div className="text-center">
                      {action.icon}
                      <div className="text-xs mt-1 font-medium">{action.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Main Card Content */}
      <div
        ref={cardRef}
        className={cn(
          "bg-card p-5 transition-transform duration-200 ease-out relative z-10",
          isDragging && "cursor-grabbing",
          !isDragging && "cursor-grab"
        )}
        style={{
          transform: `translateX(${dragX}px)`,
          WebkitTransform: `translateX(${dragX}px)`,
          touchAction: 'pan-y'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-card-foreground">
              {budget.device_model || 'Dispositivo não informado'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                {budget.device_type || 'Tipo não informado'}
              </span>
              {budget.client_name && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-sm text-primary font-medium">
                    {budget.client_name}
                  </span>
                </>
              )}
            </div>
          </div>
          <span className="text-xs text-muted-foreground/80 bg-muted/50 px-2 py-1 rounded-lg">
            {formatDate(budget.created_at)}
          </span>
        </div>

        {/* Status Badge */}
        {profile?.advanced_features_enabled && (
          <div className="mb-4">
            <BudgetLiteStatusBadge 
              status={budget.workflow_status as any || 'pending'} 
              isPaid={budget.is_paid || false} 
              isDelivered={budget.is_delivered || false} 
              expiresAt={budget.expires_at} 
            />
          </div>
        )}

        {/* Service Description */}
        <div className="mb-4">
          <p className="text-card-foreground leading-relaxed">
            {budget.issue || 'Problema não informado'}
          </p>
        </div>

        {/* Price */}
        <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-primary">
              {formatPrice(budget.total_price || 0)}
            </p>
            {budget.installments && budget.installments > 1 && (
              <span className="text-sm text-primary/70 font-medium">
                {budget.installments}x
              </span>
            )}
          </div>
        </div>

        {/* Swipe Hint */}
        {!isDragging && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              👈 Deslize para editar • Deslize para ações 👉
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xl max-w-sm mx-4">
            <Alert className="border-destructive/20 bg-destructive/5">
              <Trash2 className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-foreground">
                Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-border rounded-xl hover:bg-muted/50 transition-colors"
              >
                <XIcon className="h-4 w-4" />
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 transition-colors"
              >
                <Check className="h-4 w-4" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};