import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Copy, MessageCircle, FileText, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
interface BudgetCardModernProps {
  budget: any;
  onView?: (budget: any) => void;
  onEdit?: (budget: any) => void;
  onCopy?: (budget: any) => void;
  onWhatsApp?: (budget: any) => void;
  onPDF?: (budget: any) => void;
  isGenerating?: boolean;
  className?: string;
}
export const BudgetCardModern = ({
  budget,
  onView,
  onEdit,
  onCopy,
  onWhatsApp,
  onPDF,
  isGenerating = false,
  className
}: BudgetCardModernProps) => {
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
  const formatPrice = (price: number | null) => {
    if (!price) return 'R$ 0,00';
    return `R$ ${(price / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2
    })}`;
  };
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };
  return <Card className={cn("group hover:shadow-md transition-all duration-300 border-0 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {budget.device_model}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {budget.part_type} • ID #{budget.id?.toString().slice(-4)}
            </p>
          </div>
          
        </div>

        {/* Client Info */}
        {budget.client_name && <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">
              Cliente: {budget.client_name}
            </p>
            {budget.client_phone && <p className="text-xs text-muted-foreground">
                {budget.client_phone}
              </p>}
          </div>}

        {/* Price Info */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Valor à Vista</p>
            <p className="font-semibold text-sm text-foreground">
              {formatPrice(budget.cash_price)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Criado em</p>
            <p className="font-medium text-sm text-foreground">
              {formatDate(budget.created_at)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onView?.(budget)} className="flex-1 h-8 text-xs">
            <Eye className="w-3 h-3 mr-1" />
            Ver
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => onEdit?.(budget)} className="flex-1 h-8 text-xs">
            <Edit className="w-3 h-3 mr-1" />
            Editar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onCopy?.(budget)}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar para Novo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onWhatsApp?.(budget)}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Compartilhar WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPDF?.(budget)} disabled={isGenerating}>
                <FileText className="w-4 h-4 mr-2" />
                {isGenerating ? 'Gerando PDF...' : 'Gerar PDF'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>;
};