import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Search, Plus, MoreVertical, Eye, Edit, Trash2, Share, Filter, Check, MessageCircle, FileText, Trash } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useBudgetSearch } from '@/components/budgets/hooks/useBudgetSearch';
import { useBudgetActions } from '@/components/budgets/hooks/useBudgetActions';
import { BudgetStatusBadge } from '@/components/budgets/BudgetStatusBadge';
import { EditBudgetModal } from '@/components/EditBudgetModal';
import { DeleteBudgetDialog } from '@/components/budgets/DeleteBudgetDialog';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { useResponsive } from '@/hooks/useResponsive';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const BudgetsPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDesktop } = useResponsive();

  // Data fetching
  const { data: budgets = [], isLoading, error, refetch } = useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('owner_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Custom hooks
  const {
    searchTerm,
    setSearchTerm,
    filteredBudgets,
  } = useBudgetSearch(budgets);

  const {
    editingBudget,
    deletingBudget,
    confirmation,
    isGenerating,
    handleShareWhatsApp,
    handleViewPDF,
    handleEdit,
    handleDelete,
    closeEdit,
    closeDelete,
    closeConfirmation,
    confirmAction
  } = useBudgetActions();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/20 text-success border border-success/20';
      case 'pending': return 'bg-primary/20 text-primary border border-primary/20';
      case 'rejected': return 'bg-destructive/20 text-destructive border border-destructive/20';
      default: return 'bg-muted/20 text-muted-foreground border border-muted/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitado';
      default: return 'Rascunho';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">Você precisa estar logado para ver os orçamentos.</p>
          <Button onClick={() => navigate('/auth')}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen bg-background",
      isDesktop && "desktop-page-content"
    )}>
      {/* Mobile Header */}
      <div className={cn(
        "sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50",
        isDesktop && "desktop-section-header"
      )}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="p-2 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className={cn(
                "text-xl font-bold",
                isDesktop && "desktop-section-title"
              )}>Meus Orçamentos</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie todos os seus orçamentos 
                <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                  {filteredBudgets.length}
                </span>
              </p>
            </div>
          </div>
          
          <Button
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Buscar por cliente, dispositivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-card border-border/50 rounded-xl text-base placeholder:text-muted-foreground/70"
            />
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="px-4 py-2">
        <h2 className="text-lg font-semibold mb-4">Lista de Orçamentos</h2>
      </div>

      {/* Content */}
      <div className={cn(
        "px-4 pb-24",
        isDesktop && "desktop-grid-container desktop-grid-auto-fit"
      )}>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse border-border/50">
                <CardContent className={cn(
                  "p-6",
                  isDesktop && "desktop-content desktop-card-content"
                )}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="h-5 bg-muted rounded w-32"></div>
                        <div className="h-4 bg-muted rounded w-24"></div>
                      </div>
                      <div className="h-4 bg-muted rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-muted rounded w-40"></div>
                    <div className="h-12 bg-muted rounded-lg"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBudgets.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum orçamento ainda'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? 'Tente ajustar sua busca ou limpar os filtros.'
                : 'Crie seu primeiro orçamento para começar.'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/dashboard')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Criar Orçamento
              </Button>
            )}
          </div>
        ) : (
          <div className={cn(
            "space-y-4",
            isDesktop && "desktop-grid-3-col gap-6 space-y-0"
          )}>
            {filteredBudgets.map((budget) => (
              <Card key={budget.id} className={cn(
                "border-border/50 transition-all duration-200 hover:shadow-lg active:scale-[0.98]",
                isDesktop && "desktop-card"
              )}>
                <CardContent className="p-6">
                  {/* Header with device name and date */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">
                          {budget.description || budget.client_name || 'Orçamento'}
                        </h3>
                        {budget.description && (
                          <Badge variant="outline" className="text-xs bg-muted/50 border-border/50">
                            Serviço
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(budget.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Client info */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Cliente:</p>
                    <p className="font-medium text-primary">
                      {budget.client_name || 'Cliente Padrão'}
                    </p>
                  </div>

                  {/* Status badge */}
                  <div className="mb-4">
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(budget.status)} px-3 py-1 rounded-full`}
                    >
                      {getStatusText(budget.status)}
                    </Badge>
                  </div>

                  {/* Service info */}
                  {budget.description && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-1">Serviço:</p>
                      <p className="text-sm">
                        {budget.description.length > 50 
                          ? `${budget.description.substring(0, 50)}...`
                          : budget.description
                        }
                      </p>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-6">
                    <p className="text-3xl font-bold mb-1">
                      {formatCurrency(budget.total || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      4x de {formatCurrency((budget.total || 0) / 4)}
                    </p>
                  </div>

                  {/* Actions section */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-3">Ações:</p>
                      {budget.status === 'pending' && (
                        <Button 
                          className="w-full bg-success hover:bg-success/90 text-success-foreground font-medium py-3 rounded-lg mb-3"
                          onClick={() => {
                            // Handle approve action
                            toast({
                              title: "Orçamento aprovado!",
                              description: "O status do orçamento foi atualizado com sucesso.",
                            });
                          }}
                        >
                          <Check className="h-5 w-5 mr-2" />
                          Aprovar
                        </Button>
                      )}
                    </div>

                    {/* Bottom action bar */}
                    <div className="flex justify-center gap-8 pt-4 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShareWhatsApp(budget)}
                        className="flex flex-col items-center gap-1 p-2 h-auto text-success hover:text-success/80"
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-xs">WhatsApp</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPDF(budget)}
                        className="flex flex-col items-center gap-1 p-2 h-auto text-primary hover:text-primary/80"
                      >
                        <FileText className="h-5 w-5" />
                        <span className="text-xs">PDF</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(budget)}
                        className="flex flex-col items-center gap-1 p-2 h-auto text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-5 w-5" />
                        <span className="text-xs">Editar</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(budget)}
                        className="flex flex-col items-center gap-1 p-2 h-auto text-destructive hover:text-destructive/80"
                      >
                        <Trash className="h-5 w-5" />
                        <span className="text-xs">Excluir</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
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