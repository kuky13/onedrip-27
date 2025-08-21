import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type BillingCycle = 'monthly' | 'yearly';

interface PlanSelectorProps {
  selectedCycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
}

export const PlanSelector = ({ selectedCycle, onCycleChange }: PlanSelectorProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-8">
      <div className="flex items-center bg-muted rounded-lg p-1">
        <Button
          variant={selectedCycle === 'monthly' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onCycleChange('monthly')}
          className="relative text-xs sm:text-sm px-3 sm:px-4"
        >
          Mensal
        </Button>
        
        <Button
          variant={selectedCycle === 'yearly' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onCycleChange('yearly')}
          className="relative text-xs sm:text-sm px-3 sm:px-4 flex items-center"
        >
          Anual
          {selectedCycle === 'yearly' && (
            <Badge 
              variant="secondary" 
              className="ml-1 sm:ml-2 bg-green-100 text-green-800 text-xs px-1 sm:px-2 py-0.5 hidden sm:inline-flex"
            >
              2 meses grátis
            </Badge>
          )}
        </Button>
      </div>
      
      {selectedCycle === 'yearly' && (
        <div className="text-xs sm:text-sm text-green-600 font-medium text-center sm:ml-2">
          💰 Economize R$ 161,45!
        </div>
      )}
    </div>
  );
};