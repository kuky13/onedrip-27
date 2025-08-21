import React from 'react';
import { Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface SettingsSectionProps {
  formData: {
    includes_delivery: boolean;
    includes_screen_protector: boolean;
    observations: string;
  };
  onInputChange: (field: string, value: string | boolean) => void;
}

export const SettingsSection = ({
  formData,
  onInputChange
}: SettingsSectionProps) => {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <Settings className="h-5 w-5 text-primary" />
          Configurações Adicionais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="includes_delivery"
            checked={formData.includes_delivery}
            onCheckedChange={(checked) => onInputChange('includes_delivery', checked === true)}
          />
          <Label 
            htmlFor="includes_delivery" 
            className="text-sm font-medium text-foreground cursor-pointer"
          >
            Inclui entrega
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="includes_screen_protector"
            checked={formData.includes_screen_protector}
            onCheckedChange={(checked) => onInputChange('includes_screen_protector', checked === true)}
          />
          <Label 
            htmlFor="includes_screen_protector" 
            className="text-sm font-medium text-foreground cursor-pointer"
          >
            Inclui película protetora
          </Label>
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground">Observações</Label>
          <Textarea
            value={formData.observations}
            onChange={(e) => onInputChange('observations', e.target.value)}
            placeholder="Observações adicionais sobre o orçamento..."
            className="mt-1 min-h-[80px] resize-none"
            style={{ WebkitOverflowScrolling: 'touch' }}
          />
        </div>
      </CardContent>
    </Card>
  );
};