import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Crown, Check } from 'lucide-react';
import { PLANS_CONTENT } from '../data/content';

interface VipOptionProps {
  isSelected: boolean;
  onToggle: (selected: boolean) => void;
  billingCycle: 'monthly' | 'yearly';
}

export const VipOption = ({ isSelected, onToggle, billingCycle }: VipOptionProps) => {
  const vipData = PLANS_CONTENT.vip;
  const vipPrice = billingCycle === 'yearly' 
    ? (vipData.preco_adicional * 12).toFixed(2)
    : vipData.preco_adicional.toFixed(2);
  const vipPeriod = billingCycle === 'yearly' ? '/ano' : '/mês';

  return (
    <Card className={`transition-all duration-300 cursor-pointer ${
      isSelected 
        ? 'ring-2 ring-primary bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30' 
        : 'hover:shadow-md border-border'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Checkbox
            id="vip-option"
            checked={isSelected}
            onCheckedChange={onToggle}
            className="mt-1"
          />
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className={`h-5 w-5 ${
                isSelected ? 'text-primary' : 'text-primary/80'
              }`} />
              <label 
                htmlFor="vip-option" 
                className="text-lg font-semibold cursor-pointer"
              >
                {vipData.nome}
              </label>
              <div className="flex items-center space-x-1">
                <span className="text-lg font-bold text-primary">
                  +{vipData.moeda}{vipPrice}
                </span>
                <span className="text-sm text-muted-foreground">
                  {vipPeriod}
                </span>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-4">
              {vipData.descricao}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {vipData.beneficios.map((beneficio, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">{beneficio}</span>
                </div>
              ))}
            </div>
            
            {isSelected && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Upgrade VIP selecionado! Você terá acesso a todas as funcionalidades premium.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};