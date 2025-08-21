import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User } from '@/types/user';

interface UserRenewalDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const UserRenewalDialog = ({ user, isOpen, onClose }: UserRenewalDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Funcionalidade Desabilitada</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          A renovação de usuários foi removida. Use o sistema de licenças.
        </p>
        <Button onClick={onClose} variant="outline">Fechar</Button>
      </DialogContent>
    </Dialog>
  );
};