
import React from 'react';
import { TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Eye, Edit, Clock, Trash2, MoreHorizontal } from '@/components/ui/icons';
import { Checkbox } from '@/components/ui/checkbox';
import { BudgetStatusBadge } from './BudgetStatusBadge';
import { BudgetWorkflowActions } from './BudgetWorkflowActions';
import { useLayout } from '@/contexts/LayoutContext';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface BudgetTableRowProps {
  budget: any;
  profile: any;
  index: number;
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

export const BudgetTableRow = ({
  budget,
  profile,
  index,
  isGenerating,
  isSelected,
  onSelect,
  onShareWhatsApp,
  onViewPDF,
  onEdit,
  onDelete
}: BudgetTableRowProps) => {
  const { isMobile, isTablet } = useLayout();
  
  if (!budget || !budget.id) {
    console.warn('BudgetTableRow: budget inválido:', budget);
    return null;
  }

  // Definir tamanho do checkbox baseado no dispositivo
  const getCheckboxSize = () => {
    if (isMobile) return 'w-5 h-5';
    if (isTablet) return 'w-4 h-4';
    return 'w-3.5 h-3.5';
  };

  const getCheckboxContainer = () => {
    if (isMobile) return 'p-2 -m-2';
    if (isTablet) return 'p-1.5 -m-1.5';
    return 'p-0.5';
  };

  // Renderizar ações compactas para mobile
  const renderMobileActions = () => (
    <div className="flex items-center gap-1">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onShareWhatsApp(budget)} 
        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        <MessageCircle className="h-3.5 w-3.5" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onViewPDF(budget)} 
        disabled={isGenerating} 
        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        <Eye className="h-3.5 w-3.5" />
      </Button>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="end">
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(budget)} 
              className="w-full justify-start text-sm h-8"
            >
              <Edit className="h-3.5 w-3.5 mr-2" />
              Editar
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete(budget)} 
              className="w-full justify-start text-sm h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Excluir
            </Button>
            {profile?.advanced_features_enabled && (
              <div className="border-t pt-2 mt-2">
                <BudgetWorkflowActions 
                  budget={{
                    id: budget.id,
                    workflow_status: budget.workflow_status || 'pending',
                    is_paid: budget.is_paid || false,
                    is_delivered: budget.is_delivered || false,
                    expires_at: budget.expires_at,
                    approved_at: budget.approved_at,
                    payment_confirmed_at: budget.payment_confirmed_at,
                    delivery_confirmed_at: budget.delivery_confirmed_at,
                  }}
                  compact
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  return <>
    <TableCell className="w-8">
      <div className={cn(
        "opacity-60 hover:opacity-100 transition-all duration-200 rounded-md", 
        getCheckboxContainer(), 
        (isMobile || isTablet) && "hover:bg-muted/20"
      )}>
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={checked => onSelect(budget.id, !!checked)} 
          className={cn(
            "transition-all duration-200 hover:scale-110 border-2", 
            getCheckboxSize(), 
            isMobile && "border-muted-foreground/60 data-[state=checked]:border-primary", 
            isTablet && "border-muted-foreground/50 data-[state=checked]:border-primary/80", 
            !isMobile && !isTablet && "border-muted-foreground/40 data-[state=checked]:border-primary/60"
          )} 
        />
      </div>
    </TableCell>

    <TableCell>
      <div className="space-y-2">
        <p className="font-bold text-base text-foreground transition-colors duration-150 group-hover:text-[#fec832]">
          {budget.device_model || 'Dispositivo não informado'}
        </p>
        <p className="text-sm text-muted-foreground font-medium">{budget.device_type || 'Tipo não informado'}</p>
        {budget.client_name && <p className="text-sm text-primary/80 font-semibold">{budget.client_name}</p>}
        {profile?.advanced_features_enabled && (
          <div className="mt-2">
            <BudgetStatusBadge 
              status={budget.workflow_status || 'pending'}
              isPaid={budget.is_paid || false}
              isDelivered={budget.is_delivered || false}
              expiresAt={budget.expires_at}
            />
          </div>
        )}
      </div>
    </TableCell>

    <TableCell>
      <span className="text-sm leading-relaxed">{budget.issue || 'Problema não informado'}</span>
    </TableCell>

    <TableCell>
      <div className="space-y-1">
        <p className="font-bold text-lg text-foreground transition-colors duration-150 group-hover:text-[#fec832]">
          R$ {((budget.total_price || 0) / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2
          })}
        </p>
        {budget.installments > 1 && <p className="text-xs text-muted-foreground font-medium">{budget.installments}x</p>}
      </div>
    </TableCell>

    <TableCell>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground font-medium">
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
    </TableCell>

    <TableCell>
      {isMobile ? renderMobileActions() : (
        <div className="flex items-center justify-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onShareWhatsApp(budget)} 
            className="h-9 w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 rounded-xl transition-all duration-150"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onViewPDF(budget)} 
            disabled={isGenerating} 
            className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl transition-all duration-150 disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit(budget)} 
            className="h-9 w-9 p-0 hover:bg-muted/20 hover:text-[#fec832] rounded-xl transition-all duration-150"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(budget)} 
            className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-all duration-150"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {profile?.advanced_features_enabled && (
            <div className="ml-2 border-l pl-2">
              <BudgetWorkflowActions 
                budget={{
                  id: budget.id,
                  workflow_status: budget.workflow_status || 'pending',
                  is_paid: budget.is_paid || false,
                  is_delivered: budget.is_delivered || false,
                  expires_at: budget.expires_at,
                  approved_at: budget.approved_at,
                  payment_confirmed_at: budget.payment_confirmed_at,
                  delivery_confirmed_at: budget.delivery_confirmed_at,
                }}
                compact
              />
            </div>
          )}
        </div>
      )}
    </TableCell>
  </>;
};
