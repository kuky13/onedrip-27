import React, { useState, useEffect } from 'react';
import { generateWhatsAppMessage, shareViaWhatsApp } from '@/utils/whatsappUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, FileText, MessageCircle, Copy, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';



interface BudgetViewLiteProps {
  budgetId: string;
  onBack: () => void;
  onEdit: (budget: any) => void;
  onCopy: (budget: any) => void;
}

export const BudgetViewLite = ({ budgetId, onBack, onEdit, onCopy }: BudgetViewLiteProps) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = () => {
    // Placeholder para geração de PDF
    console.log('Gerar PDF do orçamento');
  };

  useEffect(() => {
    const loadBudget = async () => {
      if (!budgetId || !user?.id) return;

      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('*')
          .eq('id', budgetId)
          .eq('owner_id', user.id)
          .single();

        if (error) throw error;
        setBudget(data);
      } catch (error: any) {
        console.error('Error loading budget:', error);
        showError({
          title: 'Erro ao carregar',
          description: 'Não foi possível carregar o orçamento.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadBudget();
  }, [budgetId, user?.id, showError]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-500/20 text-green-900 dark:text-green-200';
      case 'pendente':
        return 'bg-yellow-500/20 text-yellow-900 dark:text-yellow-200';
      case 'rejeitado':
        return 'bg-red-500/20 text-red-900 dark:text-red-200';
      default:
        return 'bg-gray-500/20 text-gray-900 dark:text-gray-200';
    }
  };

  const handleShareWhatsApp = () => {
    if (!budget) return;

    const message = generateWhatsAppMessage({
      id: budget.id,
      device_model: budget.device_model,
      device_type: budget.device_type || 'Smartphone',
      
      part_type: budget.part_type,
      part_quality: budget.part_quality || budget.part_type || 'Reparo geral',
      cash_price: budget.cash_price,
      installment_price: budget.installment_price,
      installments: budget.installments || 1,
      total_price: budget.total_price || budget.cash_price || 0,
      warranty_months: budget.warranty_months,
      payment_condition: budget.payment_condition || 'À vista',
      includes_delivery: budget.includes_delivery || false,
      includes_screen_protector: budget.includes_screen_protector || false,
      status: 'pending',
      workflow_status: budget.workflow_status || 'pending',
      created_at: budget.created_at,
      valid_until: budget.valid_until
    });

    shareViaWhatsApp(message);
  };



  const handleDelete = async () => {
    if (!budget) return;

    if (!window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budget.id)
        .eq('owner_id', user?.id);

      if (error) throw error;

      showSuccess({
        title: 'Orçamento excluído',
        description: 'O orçamento foi movido para a lixeira.'
      });

      onBack();
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      showError({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o orçamento.'
      });
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col">
        <div className="flex items-center p-4 border-b">
          <Button variant="ghost" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Carregando...</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-md mx-4">
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-24 bg-muted rounded-lg"></div>
            <div className="h-24 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col">
        <div className="flex items-center p-4 border-b">
          <Button variant="ghost" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Orçamento não encontrado</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Este orçamento não foi encontrado.</p>
            <Button onClick={onBack}>Voltar</Button>
          </div>
        </div>
      </div>
    );
  }

  const createdDate = new Date(budget.created_at).toLocaleDateString('pt-BR');
  const validUntil = new Date(budget.valid_until).toLocaleDateString('pt-BR');
  const cashPrice = (budget.cash_price / 100).toLocaleString('pt-BR', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });

  return (
    <div className="h-[100dvh] bg-background flex flex-col">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Detalhes do Orçamento</h1>
          <p className="text-sm text-muted-foreground">#{budget.id.slice(0, 8)}</p>
        </div>
        <Badge className={getStatusColor(budget.status)}>
          {budget.status}
        </Badge>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Criado em</p>
                <p className="font-medium">{createdDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Válido até</p>
                <p className="font-medium">{validUntil}</p>
              </div>
            </div>
            {budget.client_name && (
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-medium">{budget.client_name}</p>
                {budget.client_phone && (
                  <p className="text-sm text-muted-foreground">{budget.client_phone}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dispositivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Tipo</p>
              <p className="font-medium">{budget.device_type}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Modelo</p>
              <p className="font-medium">{budget.device_model}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Tipo de Serviço</p>
              <p className="font-medium">{budget.part_type}</p>
            </div>
            {budget.brand && (
              <div>
                <p className="text-xs text-muted-foreground">Qualidade da Peça</p>
                <p className="font-medium">{budget.brand}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Garantia</p>
              <p className="font-medium">
                {budget.warranty_months} {budget.warranty_months === 1 ? 'mês' : 'meses'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Valores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Valor à Vista</p>
              <p className="text-xl font-bold text-primary">R$ {cashPrice}</p>
            </div>
            {budget.installment_price && budget.installments > 1 && (
              <div>
                <p className="text-xs text-muted-foreground">Valor Parcelado</p>
                <p className="font-medium">
                  R$ {(budget.installment_price / 100).toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })} em {budget.installments}x
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={() => onEdit(budget)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onCopy(budget)}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'PDF'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleShareWhatsApp}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
        </div>

        <Button 
          variant="destructive" 
          onClick={handleDelete}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir Orçamento
        </Button>

        <div className="pb-4"></div>
      </div>
    </div>
  );
};