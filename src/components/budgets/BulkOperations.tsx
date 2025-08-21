import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Trash2, 
  Archive, 
  Send, 
  Check, 
  X, 
  MoreHorizontal,
  FileText,
  MessageCircle,
  Download,
  Tag,
  Calendar,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

interface BulkOperationsProps {
  selectedBudgets: string[];
  totalBudgets: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: (budgetIds: string[]) => void;
  onBulkArchive: (budgetIds: string[]) => void;
  onBulkExport: (budgetIds: string[], format: 'pdf' | 'csv') => void;
  onBulkStatusUpdate: (budgetIds: string[], status: string) => void;
  onBulkWhatsAppShare: (budgetIds: string[]) => void;
}

export const BulkOperations = ({
  selectedBudgets,
  totalBudgets,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkArchive,
  onBulkExport,
  onBulkStatusUpdate,
  onBulkWhatsAppShare
}: BulkOperationsProps) => {
  const [bulkStatus, setBulkStatus] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const selectedCount = selectedBudgets.length;
  const allSelected = selectedCount === totalBudgets && totalBudgets > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalBudgets;

  const handleBulkAction = async (action: () => Promise<void> | void, successMessage: string) => {
    setIsLoading(true);
    try {
      await action();
      showSuccess({ title: 'Sucesso', description: successMessage });
    } catch (error) {
      showError({ title: 'Erro', description: 'Ocorreu um erro ao executar a operação.' });
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pendente', color: 'bg-yellow-500' },
    { value: 'approved', label: 'Aprovado', color: 'bg-blue-500' },
    { value: 'rejected', label: 'Rejeitado', color: 'bg-red-500' },
    { value: 'paid', label: 'Pago', color: 'bg-green-500' },
    { value: 'delivered', label: 'Entregue', color: 'bg-purple-500' }
  ];

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-soft animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  onSelectAll();
                } else {
                  onDeselectAll();
                }
              }}
              className={cn(
                "h-5 w-5",
                someSelected && "data-[state=checked]:bg-primary/80"
              )}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3" />
              {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
            </Badge>
            
            {selectedCount < totalBudgets && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                className="h-7 text-xs"
              >
                Selecionar todos ({totalBudgets})
              </Button>
            )}
          </div>
        </div>

        {/* Clear Selection */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDeselectAll}
          className="h-7 text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="h-3 w-3 mr-1" />
          Limpar seleção
        </Button>
      </div>

      {/* Bulk Actions */}
      <div className="space-y-4">
        {/* Primary Actions Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* WhatsApp Bulk Share */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction(
              () => onBulkWhatsAppShare(selectedBudgets),
              `${selectedCount} orçamentos compartilhados via WhatsApp`
            )}
            disabled={isLoading}
            className="gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>

          {/* PDF Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction(
              () => onBulkExport(selectedBudgets, 'pdf'),
              `${selectedCount} orçamentos exportados em PDF`
            )}
            disabled={isLoading}
            className="gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>

          {/* CSV Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction(
              () => onBulkExport(selectedBudgets, 'csv'),
              `${selectedCount} orçamentos exportados em CSV`
            )}
            disabled={isLoading}
            className="gap-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>

          {/* Archive */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction(
              () => onBulkArchive(selectedBudgets),
              `${selectedCount} orçamentos arquivados`
            )}
            disabled={isLoading}
            className="gap-2 bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
          >
            <Archive className="h-4 w-4" />
            Arquivar
          </Button>
        </div>

        {/* Status Update Row */}
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Alterar status:</span>
          
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", status.color)} />
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={() => handleBulkAction(
              () => onBulkStatusUpdate(selectedBudgets, bulkStatus),
              `Status atualizado para ${selectedCount} orçamentos`
            )}
            disabled={!bulkStatus || isLoading}
            className="h-8"
          >
            <Check className="h-3 w-3 mr-1" />
            Aplicar
          </Button>
        </div>

        {/* Separator */}
        <div className="border-t border-border/50" />

        {/* Dangerous Actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Ações irreversíveis:</span>
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Excluir ({selectedCount})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  Confirmar Exclusão em Lote
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Você está prestes a excluir <strong>{selectedCount}</strong> orçamento{selectedCount !== 1 ? 's' : ''}.
                  </p>
                  <p className="text-destructive font-medium">
                    Esta ação não pode ser desfeita.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    handleBulkAction(
                      () => onBulkDelete(selectedBudgets),
                      `${selectedCount} orçamentos excluídos`
                    );
                    setShowDeleteDialog(false);
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border/30">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{selectedCount}</div>
            <div className="text-xs text-muted-foreground">Selecionados</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-muted-foreground">{totalBudgets}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-accent">
              {Math.round((selectedCount / totalBudgets) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Porcentagem</div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="loading-spinner" />
            Processando...
          </div>
        </div>
      )}
    </div>
  );
};