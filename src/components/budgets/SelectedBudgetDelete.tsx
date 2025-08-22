
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from '@/components/ui/icons';
import { useBudgetDeletion } from '@/hooks/useBudgetDeletion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SelectedBudgetDeleteProps {
  selectedBudgets: string[];
  budgets: any[];
  onDeleteComplete: () => void;
}

export const SelectedBudgetDelete = ({ selectedBudgets, budgets, onDeleteComplete }: SelectedBudgetDeleteProps) => {
  const { handleBatchDeletion, isDeleting } = useBudgetDeletion();
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirmDelete = async () => {
    await handleBatchDeletion({
      budgetIds: selectedBudgets,
      deletionReason: `Exclusão em lote de ${selectedBudgets.length} orçamentos selecionados`
    });
    
    setIsOpen(false);
    onDeleteComplete();
  };

  if (selectedBudgets.length === 0) {
    return null;
  }

  const selectedBudgetDetails = budgets.filter(budget => selectedBudgets.includes(budget.id));

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          disabled={isDeleting}
          className="gap-2"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Mover Selecionados para Lixeira ({selectedBudgets.length})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Tem certeza que deseja mover <strong>{selectedBudgets.length} orçamento(s) selecionado(s)</strong> para a lixeira? 
            </p>
            
            <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Orçamentos selecionados:</p>
              {selectedBudgetDetails.map((budget) => (
                <div key={budget.id} className="text-sm border-b border-border pb-1 last:border-b-0">
                  <strong>Cliente:</strong> {budget.client_name || 'Não informado'} - 
                  <strong> Dispositivo:</strong> {budget.device_model || 'Não informado'} - 
                  <strong> Valor:</strong> R$ {((budget.total_price || 0) / 100).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2
                  })}
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Tranquilidade:</strong> Os orçamentos poderão ser restaurados da lixeira por até 90 dias.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Movendo...
              </>
            ) : (
              `Mover ${selectedBudgets.length} Orçamento(s)`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
