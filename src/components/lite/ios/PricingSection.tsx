
import React from 'react';
import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PricingSectionProps {
  formData: {
    total_price: number;
    installment_price: number;
    installments: number;
    enableInstallmentPrice: boolean;
    payment_condition: string;
  };
  onInputChange: (field: string, value: string | number | boolean) => void;
}

export const PricingSection = ({
  formData,
  onInputChange
}: PricingSectionProps) => {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <DollarSign className="h-5 w-5 text-primary" />
          Preços e Condições
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-foreground">Valor Total do Serviço (R$)</Label>
          <Input 
            type="number" 
            value={formData.total_price} 
            onChange={e => onInputChange('total_price', parseFloat(e.target.value) || 0)} 
            placeholder="0.00" 
            className="mt-1" 
            min="0" 
            step="0.01" 
            inputMode="decimal" 
            autoComplete="off" 
            autoFocus={false} 
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch 
            id="enable-installment" 
            checked={formData.enableInstallmentPrice} 
            onCheckedChange={checked => onInputChange('enableInstallmentPrice', checked)} 
          />
          <Label htmlFor="enable-installment" className="text-sm font-medium text-foreground">
            Habilitar preço parcelado
          </Label>
        </div>

        {formData.enableInstallmentPrice && (
          <>
            <div>
              <Label className="text-sm font-medium text-foreground">Preço Parcelado (R$)</Label>
              <Input 
                type="number" 
                value={formData.installment_price} 
                onChange={e => onInputChange('installment_price', parseFloat(e.target.value) || 0)} 
                placeholder="0.00" 
                className="mt-1" 
                min="0" 
                step="0.01" 
                inputMode="decimal" 
                autoComplete="off" 
                autoFocus={false} 
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-foreground">Número de Parcelas</Label>
              <Select value={formData.installments.toString()} onValueChange={value => onInputChange('installments', parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {[...Array(12)].map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div>
          <Label className="text-sm font-medium text-foreground">Método de Pagamento</Label>
          <Select value={formData.payment_condition} onValueChange={value => onInputChange('payment_condition', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
              <SelectItem value="À Vista">À Vista</SelectItem>
              <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
              <SelectItem value="PIX">PIX</SelectItem>
              <SelectItem value="Dinheiro">Dinheiro</SelectItem>
              <SelectItem value="Transferência">Transferência</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
