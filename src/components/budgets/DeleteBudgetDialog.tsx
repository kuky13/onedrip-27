
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBudgetDeletion } from '@/hooks/useBudgetDeletion';
import { Loader2 } from '@/components/ui/icons';

interface DeleteBudgetDialogProps {
  budget: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteBudgetDialog = ({ budget, open, onOpenChange }: DeleteBudgetDialogProps) => {
  const { handleSingleDeletion, isDeleting } = useBudgetDeletion();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDelete = async () => {
    if (!budget || !budget.id) {
      return;
    }

    setIsProcessing(true);
    console.log('DeleteBudgetDialog: Starting deletion for budget:', budget.id);
    
    try {
      await handleSingleDeletion({
        budgetId: budget.id,
        deletionReason: `Exclusão individual via interface - Cliente: ${budget.client_name || 'N/A'}`
      });
      
      console.log('DeleteBudgetDialog: Deletion completed successfully');
      
      // Aguardar um pequeno delay para garantir que a exclusão foi processada
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fechar dialog e oferecer navegação para lixeira
      onOpenChange(false);
      
      // A mensagem de sucesso já é exibida pelo useBudgetDeletion
    } catch (error) {
      console.error('DeleteBudgetDialog: Error during deletion:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!budget) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mover para Lixeira</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Tem certeza que deseja mover este orçamento para a lixeira? 
              O orçamento será preservado e poderá ser restaurado posteriormente.
            </p>
            
            <div className="p-3 bg-muted rounded-lg space-y-1">
              <p><strong>Cliente:</strong> {budget?.client_name || 'Não informado'}</p>
              <p><strong>Dispositivo:</strong> {budget?.device_model || 'Não informado'}</p>
              <p><strong>Valor:</strong> R$ {((budget?.total_price || 0) / 100).toLocaleString('pt-BR', {
                minimumFractionDigits: 2
              })}</p>
            </div>

            <p className="text-sm text-muted-foreground">
              💡 O orçamento ficará na lixeira por 90 dias antes da exclusão permanente.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting || isProcessing}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || isProcessing}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting || isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Movendo...
              </>
            ) : (
              'Mover para Lixeira'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
