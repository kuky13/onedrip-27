
import React, { useState } from 'react';
import { MessageCircle, FileText, Edit, Trash2, Star, MoreHorizontal } from 'lucide-react';
import { motion, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { BudgetLiteStatusBadge } from '../BudgetLiteStatusBadge';

interface Budget {
  id: string;
  client_name?: string;
  device_model?: string;
  device_type?: string;
  issue?: string;
  total_price?: number;
  cash_price?: number;
  workflow_status?: string;
  is_paid?: boolean;
  is_delivered?: boolean;
  expires_at?: string;
  created_at: string;
}

interface EnhancedBudgetCardProps {
  budget: Budget;
  profile: any;
  onShareWhatsApp: (budget: Budget) => void;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
  onGeneratePDF: (budget: Budget) => void;
}

export const EnhancedBudgetCard = ({
  budget,
  profile,
  onShareWhatsApp,
  onEdit,
  onDelete,
  onGeneratePDF
}: EnhancedBudgetCardProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [showActions, setShowActions] = useState(false);

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Swipe gesture handler
  const handlePan = (event: any, info: PanInfo) => {
    const { offset } = info;
    if (Math.abs(offset.x) > 80) {
      setSwipeX(offset.x > 0 ? 80 : -80);
      setShowActions(true);
    } else {
      setSwipeX(0);
      setShowActions(false);
    }
  };

  const handlePanEnd = () => {
    setSwipeX(0);
    if (showActions) {
      setTimeout(() => setShowActions(false), 2000);
    }
  };

  // Quick actions from swipe
  const handleQuickEdit = () => {
    onEdit(budget);
    setShowActions(false);
  };

  const handleQuickShare = () => {
    onShareWhatsApp(budget);
    setShowActions(false);
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Swipe Actions Background */}
      {showActions && (
        <motion.div
          className="absolute inset-0 flex items-center justify-between px-6 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={handleQuickEdit}
              className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation' }}
            >
              <Edit className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleQuickShare}
              className="flex items-center justify-center w-12 h-12 bg-green-500 text-white rounded-full shadow-lg active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation' }}
            >
              <MessageCircle className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        animate={{ x: swipeX }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onTapStart={() => setIsPressed(true)}
        onTap={() => setIsPressed(false)}
        onTapCancel={() => setIsPressed(false)}
        className={cn(
          "bg-card border border-border/50 rounded-2xl p-6 shadow-soft",
          "transition-all duration-200 cursor-pointer relative overflow-hidden",
          "hover:shadow-medium hover:border-border",
          "active:scale-[0.98]",
          isPressed && "scale-[0.98] shadow-sm"
        )}
        style={{
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translate3d(0,0,0)'
        }}
      >
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 hover:translate-x-full" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-card-foreground leading-tight truncate">
              {budget.device_model || 'Dispositivo não informado'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                {budget.device_type || 'Tipo não informado'}
              </span>
              {budget.client_name && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-sm text-primary font-medium truncate">
                    {budget.client_name}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground/80 bg-muted/30 px-3 py-1 rounded-full">
              {formatDate(budget.created_at)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-2 hover:bg-muted/50 rounded-full transition-colors active:scale-95"
              style={{ touchAction: 'manipulation' }}
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
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
        <div className="bg-muted/20 rounded-xl p-4 mb-4">
          <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wide">
            Serviço
          </p>
          <p className="text-card-foreground leading-relaxed font-medium">
            {budget.issue || 'Serviço não informado'}
          </p>
        </div>

        {/* Price Section */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/10 p-4 mb-5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs text-primary/70 font-medium mb-1 uppercase tracking-wide">
                Valor
              </p>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(budget.cash_price || budget.total_price || 0)}
              </p>
            </div>
            
            {budget.is_paid && (
              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs font-medium">Pago</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onShareWhatsApp(budget);
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
            style={{ touchAction: 'manipulation' }}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">WhatsApp</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onGeneratePDF(budget);
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
            style={{ touchAction: 'manipulation' }}
          >
            <FileText className="h-5 w-5" />
            <span className="text-sm">PDF</span>
          </motion.button>
        </div>

        {/* Swipe Hint */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="w-8 h-1 bg-muted-foreground/20 rounded-full" />
        </div>
      </motion.div>
    </motion.div>
  );
};
