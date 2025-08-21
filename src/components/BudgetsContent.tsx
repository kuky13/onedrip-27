
import React from 'react';
import { MessageCircle } from '@/components/ui/icons';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { EditBudgetModal } from '@/components/EditBudgetModal';
import { ConfirmationDialog } from './ConfirmationDialog';
import { DeleteBudgetDialog } from './budgets/DeleteBudgetDialog';
import { BudgetSearchBar } from './budgets/BudgetSearchBar';
import { ExpirationNotifications } from './ExpirationNotifications';

// Import hooks and components
import { useBudgetsData } from './budgets/hooks/useBudgetsData';
import { useBudgetSearch } from './budgets/hooks/useBudgetSearch';
import { useBudgetSelection } from './budgets/hooks/useBudgetSelection';
import { useBudgetActions } from './budgets/hooks/useBudgetActions';
import { BudgetsHeader } from './budgets/components/BudgetsHeader';
import { BudgetsList } from './budgets/components/BudgetsList';
import { BudgetsEmptyState } from './budgets/components/BudgetsEmptyState';
import { BudgetsLoadingState } from './budgets/components/BudgetsLoadingState';
import { useAdvancedBudgets } from '@/hooks/useAdvancedBudgets';
import { PDFErrorBoundary } from '@/components/ErrorBoundaries';

interface BudgetsContentProps {
  onTabChange?: (tab: string) => void;
}

export const BudgetsContent = ({ onTabChange }: BudgetsContentProps) => {
  const { user, profile } = useAuth();
  const { isAdvancedMode, hasExpiringBudgets } = useAdvancedBudgets();

  // Data fetching with optimized configurations
  const { data: budgets = [], isLoading, error, refetch } = useBudgetsData(user?.id);

  // Custom hooks
  const {
    searchTerm,
    setSearchTerm,
    filteredBudgets,
    handleSearch,
    handleKeyPress,
    clearSearch,
    hasActiveSearch
  } = useBudgetSearch(budgets);

  const {
    selectedBudgets,
    handleBudgetSelect,
    handleSelectAll,
    clearSelection,
    selectionStats
  } = useBudgetSelection(filteredBudgets);

  const {
    editingBudget,
    deletingBudget,
    confirmation,
    handleShareWhatsApp,
    handleEdit,
    handleDelete,
    closeEdit,
    closeDelete,
    closeConfirmation,
    confirmAction
  } = useBudgetActions();

  // Add missing handlers
  const isGenerating = false;
  const handleViewPDF = () => {
    console.log('PDF view not implemented');
  };

  

  // Handle delete completion with forced refetch
  const handleDeleteComplete = async () => {
    console.log('Delete completed, clearing selection and refetching...');
    clearSelection();
    await refetch();
  };

  // Early returns for different states
  if (!user) {
    return (
      <div className="p-4 lg:p-8 animate-fade-in">
        <EmptyState 
          icon={MessageCircle} 
          title="Faça login para continuar" 
          description="Você precisa estar logado para ver seus orçamentos." 
        />
      </div>
    );
  }

  if (isLoading) {
    return <BudgetsLoadingState />;
  }

  if (error) {
        console.error('Budget loading error:', error);
        return (
          <div className="p-4 lg:p-8 animate-fade-in">
            <EmptyState 
              icon={MessageCircle} 
              title="Erro ao carregar orçamentos" 
              description="Ocorreu um erro ao carregar os dados. Tente novamente." 
              action={{
                label: "Tentar Novamente",
                onClick: () => refetch()
              }} 
            />
          </div>
        );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 animate-fade-in pb-24 lg:pb-0">
      {/* Expiration Notifications - Advanced Features */}
      {isAdvancedMode && hasExpiringBudgets && (
        <div className="animate-slide-down">
          <ExpirationNotifications />
        </div>
      )}

      {/* Header */}
      <BudgetsHeader
        totalBudgets={budgets.length}
        selectedCount={selectionStats.selectedCount}
        hasSelection={selectionStats.hasSelection}
        selectedBudgets={selectedBudgets}
        budgets={filteredBudgets}
        onDeleteComplete={handleDeleteComplete}
      />

      {/* Search Bar */}
      <div className="animate-slide-down">
        <BudgetSearchBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearch={handleSearch}
          onKeyPress={handleKeyPress}
        />
      </div>
      
      {/* Content */}
      {filteredBudgets.length > 0 ? (
        <BudgetsList
          budgets={filteredBudgets}
          profile={profile}
          isGenerating={isGenerating}
          selectedBudgets={selectedBudgets}
          isAllSelected={selectionStats.isAllSelected}
          onSelect={handleBudgetSelect}
          onSelectAll={handleSelectAll}
          onShareWhatsApp={handleShareWhatsApp}
          onViewPDF={handleViewPDF}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="animate-bounce-in">
          <BudgetsEmptyState
            hasActiveSearch={hasActiveSearch}
            searchTerm={searchTerm}
            onClearSearch={clearSearch}
            onCreateBudget={() => onTabChange?.('new-budget')}
          />
        </div>
      )}

      {/* Modals with Error Boundaries */}
      <EditBudgetModal 
        budget={editingBudget} 
        open={!!editingBudget} 
        onOpenChange={(open) => !open && closeEdit()} 
      />

      <DeleteBudgetDialog
        budget={deletingBudget}
        open={!!deletingBudget}
        onOpenChange={(open) => !open && closeDelete()}
      />

      <ConfirmationDialog 
        open={!!confirmation} 
        onOpenChange={closeConfirmation} 
        onConfirm={confirmAction} 
        title={confirmation?.title || ''} 
        description={confirmation?.description || ''} 
      />
    </div>
  );
};
