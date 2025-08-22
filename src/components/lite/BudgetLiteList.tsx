import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BudgetLiteSearch } from './BudgetLiteSearch';
import { BudgetLiteCard } from './BudgetLiteCard';
import { X } from 'lucide-react';
import { generateWhatsAppMessage, shareViaWhatsApp } from '@/utils/whatsappUtils';
import { useBudgetDeletion } from '@/hooks/useBudgetDeletion';
import { useToast } from '@/hooks/use-toast';
import { EditBudgetModal } from '@/components/EditBudgetModal';

interface BudgetLiteListProps {
  budgets: any[];
  profile: any;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const BudgetLiteList = ({
  budgets,
  profile,
  loading,
  error,
  onRefresh
}: BudgetLiteListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBudgets, setFilteredBudgets] = useState(budgets);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Usar hooks do sistema principal
  const { handleSingleDeletion, isDeleting } = useBudgetDeletion();
  const { toast } = useToast();

  // Filter budgets when search term or budgets change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBudgets(budgets);
    } else {
      const filtered = budgets.filter(budget => 
        budget.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        budget.device_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        budget.device_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        budget.part_quality?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBudgets(filtered);
    }
  }, [searchTerm, budgets]);

  // Real-time subscription para atualizar dados automaticamente
  useEffect(() => {
    if (!profile?.user_id) return;

    let debounceTimer: NodeJS.Timeout | null = null;
    
    const subscription = supabase
      .channel('budget_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'budgets',
          filter: `owner_id=eq.${profile.user_id}`,
        },
        (payload) => {
          console.log('Budget change detected:', payload);
          
          // Clear previous timer
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          
          // Atualiza os dados quando houver mudanças
          debounceTimer = setTimeout(() => {
            onRefresh();
            debounceTimer = null;
          }, 500);
        }
      )
      .subscribe();

    return () => {
      // Clear debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      // Remove subscription properly
      supabase.removeChannel(subscription);
    };
  }, [profile?.user_id, onRefresh]);

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleShareWhatsApp = async (budget: any) => {
    try {
      // Buscar dados completos do orçamento
      const { data: fullBudget, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', budget.id)
        .single();

      if (error) {
        console.error('Erro ao buscar orçamento:', error);
        // Fallback com dados básicos
        const message = generateWhatsAppMessage({
          ...budget,
          part_quality: budget.part_quality || budget.part_type || 'Reparo'
        });
        shareViaWhatsApp(message);
      } else {
        // Usar dados completos do banco
        const message = generateWhatsAppMessage({
          ...fullBudget,
          part_quality: fullBudget.part_quality || fullBudget.part_type || 'Reparo'
        });
        shareViaWhatsApp(message);
      }

      toast({
        title: "Redirecionando...",
        description: "Você será redirecionado para o WhatsApp.",
      });
    } catch (error) {
      toast({
        title: "Erro ao compartilhar",
        description: "Ocorreu um erro ao preparar o compartilhamento.",
        variant: "destructive",
      });
    }
  };



  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
  };

  const handleDelete = async (budget: any) => {
    try {
      await handleSingleDeletion({ budgetId: budget.id });
      onRefresh();
    } catch (error) {
      console.error('Erro ao deletar orçamento:', error);
    }
  };

  const handleEditComplete = () => {
    setEditingBudget(null);
    onRefresh();
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border rounded-lg p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-6 bg-muted rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center space-y-4">
          <p className="text-red-600">{typeof error === 'string' ? error : String((error as any)?.message || 'Erro ao carregar orçamentos')}</p>
          <button
            onClick={onRefresh}
            className="bg-primary text-primary-foreground py-2 px-4 rounded-md text-sm font-medium"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <BudgetLiteSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={handleClearSearch}
      />

      <div className="mb-4">
        <h3 className="text-lg font-semibold">
          {filteredBudgets.length} orçamento{filteredBudgets.length !== 1 ? 's' : ''}
          {searchTerm && ` encontrado${filteredBudgets.length !== 1 ? 's' : ''}`}
        </h3>
      </div>

      {filteredBudgets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm ? 'Nenhum orçamento encontrado' : 'Nenhum orçamento cadastrado'}
          </p>
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="mt-2 text-primary hover:underline text-sm"
            >
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBudgets.map(budget => (
            <BudgetLiteCard
              key={budget.id}
              budget={budget}
              profile={profile}
              onShareWhatsApp={handleShareWhatsApp}

              onEdit={handleEdit}
              onDelete={handleDelete}
              onRefresh={onRefresh}
              isGenerating={isGenerating}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      {/* Modal de Edição usando o componente principal */}
      <EditBudgetModal 
        budget={editingBudget} 
        open={!!editingBudget} 
        onOpenChange={(open) => {
          if (!open) {
            setEditingBudget(null);
            onRefresh();
          }
        }} 
      />
    </div>
  );
};