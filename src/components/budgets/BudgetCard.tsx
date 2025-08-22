
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, FileText, Edit, Clock, Trash2 } from '@/components/ui/icons';
import { Checkbox } from '@/components/ui/checkbox';
import { useLayout } from '@/contexts/LayoutContext';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { BudgetStatusBadge } from './BudgetStatusBadge';
import { useAdvancedBudgets } from '@/hooks/useAdvancedBudgets';

interface BudgetCardProps {
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

const isBudgetOld = (createdAt: string, warningDays: number | undefined | null): boolean => {
  if (!createdAt || !warningDays) return false;
  const now = new Date();
  const budgetDate = new Date(createdAt);
  const diffTime = now.getTime() - budgetDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > warningDays;
};

export const BudgetCard = ({
  budget,
  profile,
  isGenerating,
  isSelected,
  onSelect,
  onShareWhatsApp,
  onViewPDF,
  onEdit,
  onDelete
}: BudgetCardProps) => {
  const { isMobile } = useLayout();
  const { isDesktop } = useResponsive();
  const { isAdvancedMode } = useAdvancedBudgets();

  // Verificação de segurança: não renderizar se o orçamento foi excluído
  if (!budget || !budget.id || budget.deleted_at) {
    console.warn('BudgetCard: budget inválido ou excluído:', budget);
    return null;
  }

  return (
    <Card className={cn(
      "group relative overflow-hidden border border-border/50 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl transition-all duration-300 hover:shadow-strong hover:border-primary/20 hover:scale-[1.02] hover:bg-gradient-to-br hover:from-card/90 hover:to-card/70",
      budget.deleted_at && "opacity-50 pointer-events-none",
      isDesktop && "desktop-card",
      "shadow-soft hover:shadow-medium"
    )}>
      <CardContent className={cn(
        "relative p-6 space-y-5",
        isDesktop && "desktop-content desktop-flex-row desktop-card-content"
      )}>
        {/* Header com checkbox e data */}
        <div className={cn(
          "flex items-start justify-between",
          isDesktop && "desktop-card-header"
        )}>
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-200">
                {budget.device_model || 'Dispositivo não informado'}
              </h3>
              <Badge variant="outline" className="text-xs mt-1 border-primary/30 text-primary/80 bg-primary/5 hover:bg-primary/10 transition-colors">
                {budget.device_type || 'Tipo não informado'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground/80 font-medium">
              {budget.created_at ? new Date(budget.created_at).toLocaleDateString('pt-BR') : 'Data não informada'}
            </span>
            {profile?.budget_warning_enabled && budget.created_at && isBudgetOld(budget.created_at, profile.budget_warning_days) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Clock className="h-4 w-4 text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Este orçamento tem mais de {profile.budget_warning_days} dias.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Informações do cliente */}
        {budget.client_name && (
          <div>
            <p className="text-sm text-primary font-semibold bg-primary/5 px-3 py-1.5 rounded-md border border-primary/20">
              Cliente: {budget.client_name}
            </p>
          </div>
        )}

        {/* Status Badge - Funcionalidades Avançadas */}
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

        {/* Problema/Issue */}
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-1">Serviço:</p>
          <p className="text-sm text-foreground/90 bg-muted/30 p-3 rounded-md border border-border/50">
            {budget.issue || 'Problema não informado'}
          </p>
        </div>

        <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Preço */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-2xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              R$ {((budget.total_price || 0) / 100).toLocaleString('pt-BR', {
                minimumFractionDigits: 2
              })}
            </p>
            {budget.installments > 1 && (
              <p className="text-xs text-muted-foreground/70 font-medium">{budget.installments}x</p>
            )}
          </div>
        </div>



        <Separator />

        {/* Botões de ação principais */}
        <div className={cn(
          "flex items-center justify-center gap-2 flex-wrap",
          isDesktop && "desktop-flex-row desktop-card-actions"
        )}>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onShareWhatsApp(budget)} 
            className={cn(
              "flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 transition-all duration-150", 
              isMobile ? "h-10 px-3 text-sm" : "h-9"
            )}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onViewPDF(budget)} 
            disabled={isGenerating} 
            className={cn(
              "flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-150 disabled:opacity-50", 
              isMobile ? "h-10 px-3 text-sm" : "h-9"
            )}
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Ver PDF</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit(budget)} 
            className={cn(
              "flex items-center gap-2 hover:bg-muted/20 hover:text-[#fec832] transition-all duration-150", 
              isMobile ? "h-10 px-3 text-sm" : "h-9"
            )}
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(budget)} 
            className={cn(
              "flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 transition-all duration-150", 
              isMobile ? "h-10 px-3 text-sm" : "h-9"
            )}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Excluir</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
