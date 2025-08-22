
import { useState, useCallback, useMemo } from 'react';
import { BudgetSelectionStats } from '../types';

export const useBudgetSelection = (budgets: any[] = []) => {
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([]);

  const handleBudgetSelect = useCallback((budgetId: string, isSelected: boolean) => {
    setSelectedBudgets(prev => 
      isSelected 
        ? [...prev, budgetId]
        : prev.filter(id => id !== budgetId)
    );
  }, []);

  const handleSelectAll = useCallback((isSelected: boolean) => {
    setSelectedBudgets(isSelected ? budgets.map(budget => budget.id) : []);
  }, [budgets]);

  const clearSelection = useCallback(() => {
    setSelectedBudgets([]);
  }, []);

  const isSelected = useCallback((budgetId: string) => {
    return selectedBudgets.includes(budgetId);
  }, [selectedBudgets]);

  const selectionStats = useMemo((): BudgetSelectionStats => ({
    selectedCount: selectedBudgets.length,
    hasSelection: selectedBudgets.length > 0,
    isAllSelected: selectedBudgets.length === budgets.length && budgets.length > 0
  }), [selectedBudgets, budgets]);

  return {
    selectedBudgets,
    handleBudgetSelect,
    handleSelectAll,
    clearSelection,
    isSelected,
    selectionStats
  };
};
