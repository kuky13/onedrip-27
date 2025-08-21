
import React from 'react';
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
import { User } from '@/types/user';

interface Props {
  userToDelete: User | null;
  setUserToDelete: (user: User | null) => void;
  confirmDelete: () => void;
  isPending: boolean;
}

export const UserDeletionDialog = ({ userToDelete, setUserToDelete, confirmDelete, isPending }: Props) => (
  <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
        <AlertDialogDescription>
          Tem certeza que deseja deletar o usuário <strong>{userToDelete?.name}</strong>? 
          Esta ação é irreversível e todos os dados do usuário serão perdidos.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          onClick={confirmDelete}
          className="bg-red-600 hover:bg-red-700"
          disabled={isPending}
        >
          {isPending ? 'Deletando...' : 'Deletar'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
