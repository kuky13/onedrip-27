import React from 'react';
import { MessageCircle, FileText, Trash2 } from 'lucide-react';
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

interface BudgetLiteActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'whatsapp' | 'pdf' | 'delete';
  deviceModel?: string;
  clientName?: string;
  isLoading?: boolean;
}

export const BudgetLiteActionDialog = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  deviceModel,
  clientName,
  isLoading = false
}: BudgetLiteActionDialogProps) => {
  const getDialogConfig = () => {
    switch (type) {
      case 'whatsapp':
        return {
          icon: <MessageCircle className="h-6 w-6 text-green-400" />,
          title: 'Enviar para WhatsApp',
          description: `Deseja enviar o orçamento${deviceModel ? ` do ${deviceModel}` : ''}${clientName ? ` para ${clientName}` : ''} via WhatsApp?`,
          confirmText: 'Enviar',
          confirmClass: 'bg-green-600 hover:bg-green-700 text-white'
        };
      case 'pdf':
        return {
          icon: <FileText className="h-6 w-6 text-blue-400" />,
          title: 'Gerar PDF',
          description: `Deseja gerar o PDF do orçamento${deviceModel ? ` do ${deviceModel}` : ''}?`,
          confirmText: 'Gerar PDF',
          confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      case 'delete':
        return {
          icon: <Trash2 className="h-6 w-6 text-red-400" />,
          title: 'Mover para Lixeira',
          description: `Tem certeza que deseja mover o orçamento${deviceModel ? ` do ${deviceModel}` : ''} para a lixeira? Esta ação pode ser desfeita posteriormente.`,
          confirmText: 'Mover para Lixeira',
          confirmClass: 'bg-red-600 hover:bg-red-700 text-white'
        };
      default:
        return {
          icon: null,
          title: '',
          description: '',
          confirmText: 'Confirmar',
          confirmClass: ''
        };
    }
  };

  const config = getDialogConfig();

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-sm mx-auto">
        <AlertDialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {config.icon}
          </div>
          <AlertDialogTitle className="text-lg font-semibold">
            {config.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {config.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <AlertDialogCancel 
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto ${config.confirmClass}`}
          >
            {isLoading ? 'Processando...' : config.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};