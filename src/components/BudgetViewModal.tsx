import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { FileText, MessageCircle, Edit, X } from 'lucide-react';
interface BudgetViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: any;
  onEdit?: (budget: any) => void;
  onPDF?: (budget: any) => void;
  onWhatsApp?: (budget: any) => void;
  isGenerating?: boolean;
}
export const BudgetViewModal = ({
  open,
  onOpenChange,
  budget,
  onEdit,
  onPDF,
  onWhatsApp,
  isGenerating = false
}: BudgetViewModalProps) => {
  const { isDesktop } = useResponsive();
  
  if (!budget) return null;
  const formatPrice = (price: number | null) => {
    if (!price) return 'R$ 0,00';
    return `R$ ${(price / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2
    })}`;
  };
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aprovado':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800';
      case 'rejeitado':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800';
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-2xl max-h-[80vh] overflow-y-auto",
        isDesktop && "max-w-6xl desktop-modal desktop-view-layout"
      )}>
        <DialogHeader className={cn(
          isDesktop && "desktop-section-header"
        )}>
          <DialogTitle className={cn(
            "flex items-center justify-between",
            isDesktop && "desktop-section-title"
          )}>
            <span>Visualizar Orçamento #{budget.id?.toString().slice(-4)}</span>
            <Badge className={`${getStatusColor(budget.workflow_status || 'pendente')} border`} variant="secondary">
              {budget.workflow_status || 'Pendente'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className={cn(
          "space-y-6",
          isDesktop && "desktop-grid-2-col gap-8 space-y-0"
        )}>
          {/* Informações do Cliente */}
          <Card className={cn(
            isDesktop && "desktop-card"
          )}>
            <CardHeader>
              <CardTitle className="text-lg">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{budget.client_name || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{budget.client_phone || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Dispositivo */}
          <Card className={cn(
            isDesktop && "desktop-card"
          )}>
            <CardHeader>
              <CardTitle className="text-lg">Dispositivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{budget.device_type || 'Não informado'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aparelho/Serviço</p>
                <p className="font-medium">{budget.device_model || 'Não informado'}</p>
              </div>
              {budget.issue && <div>
                  <p className="text-sm text-muted-foreground">Problema</p>
                  <p className="font-medium">{budget.issue}</p>
                </div>}
            </CardContent>
          </Card>

          {/* Informações do Serviço */}
          <Card className={cn(
            isDesktop && "desktop-card"
          )}>
            <CardHeader>
              <CardTitle className="text-lg">Qualidade de peça</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  
                  <p className="font-medium">{budget.part_quality || budget.part_type || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Garantia</p>
                  <p className="font-medium">{budget.warranty_months || 0} meses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações de Preços */}
          <Card className={cn(
            isDesktop && "desktop-card"
          )}>
            <CardHeader>
              <CardTitle className="text-lg">Valores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Valor à Vista</p>
                  <p className="font-semibold text-lg">{formatPrice(budget.cash_price)}</p>
                </div>
                {budget.installment_price && <div>
                    <p className="text-sm text-muted-foreground">Valor Parcelado</p>
                    <p className="font-semibold text-lg">{formatPrice(budget.installment_price)}</p>
                  </div>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                  <p className="font-medium">{budget.payment_condition || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Parcelas</p>
                  <p className="font-medium">{budget.installments || 1}x</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Inclui Entrega</p>
                  <p className="font-medium">{budget.includes_delivery ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inclui Película</p>
                  <p className="font-medium">{budget.includes_screen_protector ? 'Sim' : 'Não'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-medium">{formatDate(budget.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Válido até</p>
                  <p className="font-medium">{budget.valid_until ? formatDate(budget.valid_until) : 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {budget.notes && <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{budget.notes}</p>
              </CardContent>
            </Card>}

          <Separator />

          {/* Ações */}
          <div className={cn(
            "flex gap-2 flex-wrap",
            isDesktop && "desktop-flex-row desktop-card-actions col-span-2"
          )}>
            <Button variant="outline" onClick={() => onEdit?.(budget)} className="flex-1">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" onClick={() => onPDF?.(budget)} disabled={isGenerating} className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              {isGenerating ? 'Gerando...' : 'Gerar PDF'}
            </Button>
            <Button variant="outline" onClick={() => onWhatsApp?.(budget)} className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};