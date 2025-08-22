import React, { useState, useEffect } from 'react';
import { generateWhatsAppMessage, shareViaWhatsApp } from '@/utils/whatsappUtils';
import { BudgetFormSteps } from './budget/BudgetFormSteps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, ArrowLeft, Search, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BudgetCardModern } from './budget/BudgetCardModern';
import { BudgetCardSkeleton } from './budget/BudgetFormSkeleton';
import { EditBudgetModal } from '@/components/EditBudgetModal';
import { useToast } from '@/hooks/useToast';

import { ConfirmationDialog } from './ConfirmationDialog';

import { BudgetErrorBoundary, PDFErrorBoundary } from '@/components/ErrorBoundaries';
import { BudgetBreadcrumbs } from './budget/BudgetBreadcrumbs';
import { useBudgetErrorHandler } from './budgets/hooks/useBudgetErrorHandler';
import { useBudgetActions } from './budgets/hooks/useBudgetActions';
import { BudgetViewModal } from './BudgetViewModal';
import { useBudgetSearch } from './budgets/hooks/useBudgetSearch';

interface UnifiedNewBudgetContentProps {
  userId?: string;
  onBack?: () => void;
  isLite?: boolean;
}

export const UnifiedNewBudgetContent = ({
  userId,
  onBack,
  isLite = false
}: UnifiedNewBudgetContentProps) => {
  const [showForm, setShowForm] = useState(false);
  const [copiedBudgetData, setCopiedBudgetData] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewBudget, setViewBudget] = useState<any | null>(null);
  const [confirmation, setConfirmation] = useState<{
    action: () => void;
    title: string;
    description: string;
  } | null>(null);

  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const { handleAsyncError } = useBudgetErrorHandler();
  const { handleCopy } = useBudgetActions();

  const [allBudgets, setAllBudgets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(isLite);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Hook de pesquisa
  const {
    searchTerm,
    setSearchTerm,
    filteredBudgets,
    handleSearch,
    handleKeyPress,
    clearSearch,
    hasActiveSearch
  } = useBudgetSearch(allBudgets);

  useEffect(() => {
    const fetchBudgets = async () => {
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const query = supabase
          .from('budgets')
          .select('*')
          .eq('owner_id', targetUserId)
          .is('deleted_at', null) // Sempre excluir orçamentos na lixeira
          .order('created_at', { ascending: false });

        // Se não há pesquisa ativa, limitar a 3 para mostrar apenas recentes
        if (!hasActiveSearch) {
          query.limit(3);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching budgets:', error);
          setAllBudgets([]);
        } else {
          setAllBudgets(data || []);
        }
      } catch (error) {
        console.error('Error fetching budgets:', error);
        setAllBudgets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgets();
  }, [user?.id, userId, isLite, hasActiveSearch]);

  // Determinar quais orçamentos mostrar
  const budgetsToShow = hasActiveSearch ? filteredBudgets : allBudgets;

  const handleEdit = (budget: any) => {
    setSelectedBudget(budget);
    setIsEditModalOpen(true);
  };

  const handleView = (budget: any) => {
    setViewBudget(budget);
    setIsViewModalOpen(true);
  };



  const handleShareWhatsApp = (budget: any) => {
    setConfirmation({
      action: () => {
        try {
          const message = generateWhatsAppMessage({
            ...budget,
            service_specification: budget.service_specification || budget.part_type
          });
          shareViaWhatsApp(message);
          showSuccess({
            title: "Redirecionando...",
            description: "Você será redirecionado para o WhatsApp."
          });
        } catch (error) {
          showError({
            title: "Erro ao compartilhar",
            description: "Ocorreu um erro ao preparar o compartilhamento."
          });
        }
      },
      title: "Compartilhar via WhatsApp?",
      description: "Você será redirecionado para o WhatsApp para enviar os detalhes do orçamento."
    });
  };

  const handleFormBack = () => {
    setShowForm(false);
    setCopiedBudgetData(null);
  };

  const breadcrumbItems = [
    { label: 'Dashboard' },
    { label: 'Novo Orçamento', active: true },
  ];

  if (showForm) {
    return <BudgetFormSteps onBack={handleFormBack} initialData={copiedBudgetData} />;
  }

  return (
    <BudgetErrorBoundary>
      <div className="min-h-[100dvh] bg-background p-4 space-y-6">
        {/* Breadcrumbs - only show if not lite */}
        {!isLite && <BudgetBreadcrumbs items={breadcrumbItems} />}

        {/* Back button for lite version */}
        {isLite && onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Orçamento</h1>
          <p className="text-muted-foreground mt-1">Crie um novo orçamento ou veja os mais recentes.</p>
        </div>

        {/* Create New Budget Card */}
        <Card className="border-primary/20 shadow-sm bg-gradient-to-br from-primary/5 via-primary/10 to-transparent">
          <CardHeader>
            {!isLite && (
              <CardTitle className="text-xl flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Comece um Novo Orçamento
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Pronto para começar?</h3>
              <p className="text-muted-foreground mb-6">
                Crie um orçamento detalhado em etapas simples e organizadas.
              </p>
              <Button 
                onClick={() => setShowForm(true)} 
                size="lg" 
                className="shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Plus className="mr-2 h-5 w-5" />
                Criar Orçamento
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Budgets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {hasActiveSearch ? `Resultados da Pesquisa (${budgetsToShow.length})` : 'Orçamentos Recentes'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Pesquisar por cliente, dispositivo ou problema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <BudgetCardSkeleton key={i} />
                ))}
              </div>
            ) : budgetsToShow && budgetsToShow.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {budgetsToShow.map(budget => (
                  <BudgetCardModern
                    key={budget.id}
                    budget={budget}
                    onView={handleView}
                    onEdit={handleEdit}
                    onCopy={handleCopy}
    
                    onWhatsApp={handleShareWhatsApp}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                  {hasActiveSearch ? (
                    <Search className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <p className="text-muted-foreground">
                  {hasActiveSearch 
                    ? 'Nenhum orçamento encontrado para sua pesquisa.'
                    : 'Ainda não há orçamentos criados. Crie seu primeiro orçamento!'
                  }
                </p>
                {hasActiveSearch && (
                  <Button
                    variant="outline"
                    onClick={clearSearch}
                    className="mt-3"
                  >
                    Limpar pesquisa
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {selectedBudget && (
        <EditBudgetModal 
          open={isEditModalOpen} 
          onOpenChange={setIsEditModalOpen} 
          budget={selectedBudget} 
        />
      )}

      {viewBudget && (
        <BudgetViewModal 
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          budget={viewBudget}
          onEdit={(budget) => {
            setSelectedBudget(budget);
            setIsEditModalOpen(true);
            setIsViewModalOpen(false);
          }}
          
          onWhatsApp={handleShareWhatsApp}
        />
      )}
      
      <PDFErrorBoundary>
        <ConfirmationDialog 
          open={!!confirmation} 
          onOpenChange={() => setConfirmation(null)} 
          onConfirm={() => {
            if (confirmation) {
              confirmation.action();
              setConfirmation(null);
            }
          }} 
          title={confirmation?.title || ''} 
          description={confirmation?.description || ''} 
        />
      </PDFErrorBoundary>
    </BudgetErrorBoundary>
  );
};