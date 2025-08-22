
import React from 'react';
import { Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DeviceSectionProps {
  formData: {
    device_type: string;
    device_model: string;
    part_type: string;
    warranty_months: number;
  };
  onInputChange: (field: string, value: string | number) => void;
}

export const DeviceSection = ({
  formData,
  onInputChange
}: DeviceSectionProps) => {
  // Sempre garantir que o device_type seja "Celular" por padrão
  React.useEffect(() => {
    if (!formData.device_type || formData.device_type !== 'Celular') {
      onInputChange('device_type', 'Celular');
    }
  }, []);

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <Smartphone className="h-5 w-5 text-primary" />
          Informações do Dispositivo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-foreground">Tipo de Dispositivo</Label>
          <Select value="Celular" onValueChange={value => onInputChange('device_type', value)} disabled>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Celular" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="Celular">Celular</SelectItem>
              <SelectItem value="Tablet">Tablet</SelectItem>
              <SelectItem value="Notebook">Notebook</SelectItem>
              <SelectItem value="Smartwatch">Smartwatch</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground">Serviço/Aparelho</Label>
          <Input 
            type="text" 
            value={formData.device_model} 
            onChange={e => onInputChange('device_model', e.target.value)} 
            placeholder="Ex: Tela iPhone 12, Bateria Redmi Note 8" 
            className="mt-1" 
            autoComplete="off" 
            autoFocus={false} 
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground">Qualidade</Label>
          <Input 
            type="text" 
            value={formData.part_type} 
            onChange={e => onInputChange('part_type', e.target.value)} 
            placeholder="Ex: Original Nacional, Gold, Peça Genuína..." 
            className="mt-1" 
            autoComplete="off" 
            autoFocus={false} 
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground">Garantia</Label>
          <Select value={formData.warranty_months.toString()} onValueChange={value => onInputChange('warranty_months', parseInt(value))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="1">1 mês</SelectItem>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
