
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

interface MassDeleteButtonProps {
  budgetCount: number;
  disabled?: boolean;
}

export const MassDeleteButton = ({ budgetCount, disabled = false }: MassDeleteButtonProps) => {
  const { handleMassDeletion, isDeleting } = useBudgetDeletion();
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirmDelete = async () => {
    await handleMassDeletion({
      deletionReason: `Exclusão em massa de ${budgetCount} orçamentos via interface`
    });
    setIsOpen(false);
  };

  if (budgetCount === 0) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          disabled={disabled || isDeleting}
          className="gap-2"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Mover Todos para Lixeira ({budgetCount})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão em Massa</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Tem certeza que deseja mover <strong>TODOS os {budgetCount} orçamentos</strong> para a lixeira? 
            </p>
            
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ <strong>Atenção:</strong> Esta ação moverá todos os seus orçamentos para a lixeira.
              </p>
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
              `Mover Todos os ${budgetCount} Orçamentos`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
