import React, { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BudgetLiteCardiOS } from './BudgetLiteCardiOS';
import { generateWhatsAppMessage, shareViaWhatsApp } from '@/utils/whatsappUtils';
import { useToast } from '@/hooks/use-toast';

import { SecureRedirect } from '@/utils/secureRedirect';
import { IOSContextualHeaderEnhanced } from './enhanced/IOSContextualHeaderEnhanced';
import { GlassCard } from '@/components/ui/animations/micro-interactions';
import { StaggerContainer } from '@/components/ui/animations/page-transitions';
import { AdvancedSkeleton } from '@/components/ui/animations/loading-states';
import { useBudgetData } from '@/hooks/useBudgetData';

interface Budget {
  id: string;
  client_name?: string;
  device_model?: string;
  device_type?: string;
  total_price?: number;
  workflow_status?: string;
  is_paid?: boolean;
  is_delivered?: boolean;
  expires_at?: string;
  approved_at?: string;
  payment_confirmed_at?: string;
  delivery_confirmed_at?: string;
  created_at: string;
  installments?: number;
  cash_price?: number;
  installment_price?: number;
  warranty_months?: number;
  includes_delivery?: boolean;
  includes_screen_protector?: boolean;
  valid_until?: string;
  part_type?: string;
  brand?: string;
  owner_id?: string;
  deleted_at?: string | null;
  delivery_date?: string;
  notes?: string;
}

interface BudgetLiteListiOSProps {
  userId: string;
  profile: any;
}

export const BudgetLiteListiOS = ({
  userId,
  profile
}: BudgetLiteListiOSProps) => {
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Hook de dados dos orçamentos
  const { budgets: allBudgets, loading: isLoading, error, handleRefresh } = useBudgetData(userId);
  
  // Estados de pesquisa
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Filtrar orçamentos baseado na pesquisa
  const budgets = useMemo(() => {
    if (!searchTerm.trim()) return allBudgets;
    
    const searchLower = searchTerm.toLowerCase();
    return allBudgets.filter(budget => 
      budget.client_name?.toLowerCase().includes(searchLower) ||
      budget.device_model?.toLowerCase().includes(searchLower) ||
      budget.device_type?.toLowerCase().includes(searchLower)
    );
  }, [allBudgets, searchTerm]);

  // Handlers de pesquisa
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    // Pesquisa é feita automaticamente
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
    setIsSearchActive(false);
  }, []);

  const handleSearchToggle = useCallback(() => {
    setIsSearchActive(!isSearchActive);
    if (isSearchActive) {
      setSearchTerm('');
    }
  }, [isSearchActive]);

  // Estados derivados
  const hasActiveSearch = searchTerm.trim().length > 0;
  const searchSubtitle = hasActiveSearch ? `${budgets.length} resultado(s) encontrado(s)` : `${allBudgets.length} orçamentos`;

  // Função de exclusão com auditoria
  const handleDeleteBudget = useCallback(async (budgetId: string) => {
    try {
      // Usar a função RPC para soft delete com auditoria
      const { data, error } = await supabase.rpc('soft_delete_budget_with_audit', {
        p_budget_id: budgetId,
        p_deletion_reason: 'Exclusão via interface mobile iOS'
      });

      if (error) {
        console.error('Error in soft delete RPC:', error);
        throw new Error(error.message || 'Erro ao excluir orçamento');
      }

      const response = data as any;
      if (!response?.success) {
        throw new Error(response?.error || 'Falha na exclusão do orçamento');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting budget:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao excluir orçamento' };
    }
  }, []);


  // Compartilhamento WhatsApp usando utilitário original
  const handleShareWhatsApp = useCallback(async (budget: Budget) => {
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
        const budgetData = {
          id: budget.id,
          device_model: budget.device_model || 'Dispositivo',
          device_type: budget.device_type || 'Smartphone',
          part_type: budget.part_type || 'Serviço',
          part_quality: budget.part_type || 'Reparo geral',
          cash_price: budget.cash_price || budget.total_price || 0,
          installment_price: budget.installment_price || 0,
          installments: budget.installments || 1,
          total_price: budget.total_price || 0,
          warranty_months: budget.warranty_months || 3,
          payment_condition: 'Cartão de Crédito',
          includes_delivery: budget.includes_delivery || false,
          includes_screen_protector: budget.includes_screen_protector || false,
          delivery_date: budget.delivery_date,
          notes: budget.notes,
          status: 'pending',
          workflow_status: budget.workflow_status || 'pending',
          created_at: budget.created_at,
          valid_until: budget.valid_until || budget.expires_at || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          expires_at: budget.expires_at
        };
        
        const message = generateWhatsAppMessage(budgetData);
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
        description: "Você será redirecionado para o WhatsApp."
      });
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      toast({
        title: "Erro ao compartilhar",
        description: "Ocorreu um erro ao preparar o compartilhamento.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Geração de PDF simplificada
  const handleViewPDF = useCallback(async (budget: Budget) => {
    try {
      setUpdating(budget.id);

      // Simplified PDF generation using direct URL approach for iOS compatibility
      const pdfData = encodeURIComponent(JSON.stringify({
        id: budget.id,
        device_model: budget.device_model || 'Dispositivo',
        device_type: budget.device_type || 'Celular',
        part_quality: budget.part_type || 'Reparo',
        cash_price: budget.cash_price || budget.total_price || 0,
        client_name: budget.client_name,
        created_at: budget.created_at
      }));

      // Use a simpler approach that works on iOS
      const safeUrl = SecureRedirect.getSafeRedirectUrl(`/print-budget?data=${pdfData}`);
      window.open(safeUrl, '_blank');

      toast({
        title: "PDF gerado!",
        description: "O PDF foi aberto em uma nova aba."
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  }, [toast]);

  // Exclusão de orçamento
  const handleDelete = useCallback(async (budgetId: string) => {
    try {
      setUpdating(budgetId);
      
      const result = await handleDeleteBudget(budgetId);
      
      if (result.success) {
        handleRefresh(); // Atualiza a lista
        toast({
          title: "Orçamento removido",
          description: "O orçamento foi movido para a lixeira."
        });
      } else {
        throw new Error(result.error || 'Falha na exclusão do orçamento');
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast({
        title: "Erro ao remover",
        description: typeof error === 'string' ? error : "Não foi possível remover o orçamento.",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  }, [handleDeleteBudget, handleRefresh, toast]);

  // Callback para atualização de orçamento  
  const handleBudgetUpdate = useCallback((budgetId: string, updates: Partial<Budget>) => {
    // Trigger refresh after update
    setTimeout(() => {
      handleRefresh();
    }, 500);
  }, [handleRefresh]);

  // Estados de loading e erro
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground">
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <GlassCard key={i} className="p-4">
              <AdvancedSkeleton lines={3} avatar />
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-destructive text-6xl">⚠️</div>
          <p className="text-destructive text-lg">{typeof error === 'string' ? error : 'Erro inesperado'}</p>
          <button 
            onClick={handleRefresh} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-6 rounded-lg font-medium transition-colors w-full"
            style={{ touchAction: 'manipulation' }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Header Contextual Unificado */}
      <IOSContextualHeaderEnhanced
        title="Orçamentos"
        subtitle={searchSubtitle}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
        showSearch={true}
        onSearchToggle={handleSearchToggle}
        searchActive={isSearchActive}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onSearchClear={handleSearchClear}
        searchPlaceholder="Buscar cliente ou dispositivo..."
        isSearching={false}
      />

      {/* Content com scroll otimizado para iOS */}
      <div 
        className="overflow-auto" 
        style={{
          WebkitOverflowScrolling: 'touch',
          height: 'calc(100dvh - 140px)',
          overscrollBehavior: 'none',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div className="px-4 py-6">
          {/* Empty state otimizado */}
          {budgets.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-7xl mb-6">📋</div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {hasActiveSearch ? 'Nenhum resultado' : 'Nenhum orçamento'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {hasActiveSearch 
                  ? 'Tente ajustar sua busca' 
                  : 'Comece criando seu primeiro orçamento'
                }
              </p>
              {hasActiveSearch && (
                <div className="flex gap-3 justify-center">
                  <button 
                    onClick={handleSearchClear} 
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium" 
                    style={{ touchAction: 'manipulation' }}
                  >
                    Limpar busca
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Lista de orçamentos com performance otimizada */
            <StaggerContainer className="space-y-4">
              {budgets.map((budget, index) => (
                <div 
                  key={budget.id} 
                  className={`transition-opacity duration-200 ${updating === budget.id ? 'opacity-50' : 'opacity-100'}`}
                  style={{
                    transform: 'translateZ(0)', // Force GPU acceleration
                    willChange: 'transform'
                  }}
                >
                  <BudgetLiteCardiOS 
                    budget={budget} 
                    profile={profile} 
                    onShareWhatsApp={handleShareWhatsApp} 
                    onDelete={handleDelete} 
                    onBudgetUpdate={updates => handleBudgetUpdate(budget.id, updates)} 
                  />
                </div>
              ))}
            </StaggerContainer>
          )}
        </div>
      </div>
    </div>
  );
};
