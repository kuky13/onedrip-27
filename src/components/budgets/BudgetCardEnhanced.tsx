import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, FileText, Edit, Trash2, Clock, Eye, DollarSign, Calendar, User, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BudgetStatusBadge } from './BudgetStatusBadge';

import { useAdvancedBudgets } from '@/hooks/useAdvancedBudgets';
import { useLayout } from '@/contexts/LayoutContext';

interface BudgetCardEnhancedProps {
  budget: any;
  profile: any;
  isGenerating: boolean;
  isSelected: boolean;
  onSelect: (budgetId: string, isSelected: boolean) => void;
  onShareWhatsApp: (budget: any) => void;
  onViewPDF: (budget: any) => void;
  onEdit: (budget: any) => void;
  onDelete: (budget: any) => void;
}

export const BudgetCardEnhanced = ({
  budget,
  profile,
  isGenerating,
  isSelected,
  onSelect,
  onShareWhatsApp,
  onViewPDF,
  onEdit,
  onDelete
}: BudgetCardEnhancedProps) => {
  const { isMobile } = useLayout();
  const { isAdvancedMode } = useAdvancedBudgets();
  const [isHovered, setIsHovered] = useState(false);

  if (!budget || !budget.id || budget.deleted_at) {
    return null;
  }

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const isBudgetOld = (createdAt: string, warningDays: number | undefined | null): boolean => {
    if (!createdAt || !warningDays) return false;
    const now = new Date();
    const budgetDate = new Date(createdAt);
    const diffTime = now.getTime() - budgetDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > warningDays;
  };

  return (
    <Card 
      className={cn(
        "card-premium group relative overflow-hidden transition-all duration-300 ease-out",
        "hover:shadow-xl hover:scale-[1.02] hover:border-primary/20",
        budget.deleted_at && "opacity-50 pointer-events-none",
        isSelected && "ring-2 ring-primary/30 border-primary/40"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Gradient Overlay on Hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none",
        "bg-gradient-to-br from-primary/5 via-transparent to-accent/5",
        isHovered && "opacity-100"
      )} />

      <CardContent className="relative p-6 space-y-5">
        {/* Header Principal - Layout Otimizado */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Device Info - Hierarquia Visual Clara */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-foreground truncate">
                  {budget.device_model || 'Dispositivo'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs font-medium">
                    {budget.device_type || 'Tipo'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Client Info - Com Ícone */}
            {budget.client_name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4 text-primary/60" />
                <span className="font-medium text-primary">{budget.client_name}</span>
              </div>
            )}
          </div>

          {/* Date & Status Indicators */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(budget.created_at)}</span>
            </div>
            
            {/* Warning Badge */}
            {profile?.budget_warning_enabled && 
             budget.created_at && 
             isBudgetOld(budget.created_at, profile.budget_warning_days) && (
              <Badge variant="destructive" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Antigo
              </Badge>
            )}
          </div>
        </div>

        {/* Status Badge - Advanced Features */}
        {isAdvancedMode && (
          <div className="flex justify-start">
            <BudgetStatusBadge 
              status={budget.workflow_status || 'pending'}
              isPaid={budget.is_paid || false}
              isDelivered={budget.is_delivered || false}
              expiresAt={budget.expires_at}
            />
          </div>
        )}

        {/* Service Description - Destaque Principal */}
        <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Edit className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Serviço:</p>
              <p className="text-foreground leading-relaxed">
                {budget.issue || 'Problema não informado'}
              </p>
            </div>
          </div>
        </div>

        {/* Price Section - Redesenhado */}
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(budget.total_price || 0)}
                </p>
              </div>
            </div>
            
            {budget.installments > 1 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Parcelamento</p>
                <p className="text-sm font-semibold text-accent">
                  {budget.installments}x
                </p>
              </div>
            )}
          </div>
        </div>



        <Separator className="my-4" />

        {/* Action Buttons - Redesenhados com Micro-interactions */}
        <div className="space-y-3">
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => onShareWhatsApp(budget)} 
              className="btn-apple bg-green-600 hover:bg-green-700 text-white group"
              size={isMobile ? "default" : "sm"}
            >
              <MessageCircle className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              WhatsApp
            </Button>
            
            <Button 
              onClick={() => onViewPDF(budget)} 
              disabled={isGenerating} 
              className="btn-apple bg-blue-600 hover:bg-blue-700 text-white group"
              size={isMobile ? "default" : "sm"}
            >
              <FileText className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              {isGenerating ? 'Gerando...' : 'Ver PDF'}
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => onEdit(budget)} 
              className="group hover:border-accent hover:text-accent"
              size={isMobile ? "default" : "sm"}
            >
              <Edit className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Editar
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => onDelete(budget)} 
              className="group hover:border-destructive hover:text-destructive"
              size={isMobile ? "default" : "sm"}
            >
              <Trash2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Quick Action Hint - Appears on Hover */}
        <div className={cn(
          "absolute top-2 right-2 opacity-0 transition-all duration-300 pointer-events-none",
          isHovered && "opacity-100"
        )}>
          <div className="bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-lg">
            <Eye className="h-3 w-3 inline mr-1" />
            Clique para detalhes
          </div>
        </div>
      </CardContent>
    </Card>
  );
};