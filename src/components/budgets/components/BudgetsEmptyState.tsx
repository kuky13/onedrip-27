
import React from 'react';
import { EmptyState } from '@/components/EmptyState';
import { MessageCircle } from '@/components/ui/icons';

interface BudgetsEmptyStateProps {
  hasActiveSearch: boolean;
  searchTerm: string;
  onClearSearch: () => void;
  onCreateBudget?: () => void;
}

export const BudgetsEmptyState = ({
  hasActiveSearch,
  searchTerm,
  onClearSearch,
  onCreateBudget
}: BudgetsEmptyStateProps) => {
  if (hasActiveSearch) {
    return (
      <div className="p-6 animate-fade-in">
        <EmptyState 
          icon={MessageCircle} 
          title="Nenhum resultado encontrado" 
          description={`Não encontramos orçamentos com "${searchTerm}". Tente uma busca diferente.`}
          action={{
            label: "Limpar busca",
            onClick: onClearSearch
          }}
          className="border-0 shadow-none" 
        />
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <EmptyState 
        icon={MessageCircle} 
        title="Nenhum orçamento encontrado" 
        description="Você ainda não criou nenhum orçamento. Comece criando seu primeiro orçamento para começar a gerenciar suas vendas."
        action={{
          label: "Criar Primeiro Orçamento",
          onClick: onCreateBudget
        }}
        className="border-0 shadow-none" 
      />
    </div>
  );
};
