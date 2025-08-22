import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SelectedBudgetDelete } from '../SelectedBudgetDelete';

interface BudgetsHeaderProps {
  totalBudgets: number;
  selectedCount: number;
  hasSelection: boolean;
  selectedBudgets: string[];
  budgets: any[];
  onDeleteComplete: () => void;
}

export const BudgetsHeader = ({
  totalBudgets,
  selectedCount,
  hasSelection,
  selectedBudgets,
  budgets,
  onDeleteComplete
}: BudgetsHeaderProps) => {
  return (
    <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 animate-slide-up">
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Meus Orçamentos</h1>
        <div className="flex items-center space-x-2">
          <p className="text-sm lg:text-base text-muted-foreground">
            Gerencie todos os seus orçamentos
          </p>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 animate-fade-in">
            {totalBudgets}
          </Badge>
          {hasSelection && (
            <Badge variant="outline" className="bg-secondary/10 text-secondary-foreground border-secondary animate-fade-in">
              {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex justify-end animate-fade-in">
        <SelectedBudgetDelete 
          selectedBudgets={selectedBudgets} 
          budgets={budgets} 
          onDeleteComplete={onDeleteComplete} 
        />
      </div>
    </div>
  );
};