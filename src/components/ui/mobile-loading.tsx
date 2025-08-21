import React from 'react';
import { cn } from '@/lib/utils';

interface MobileLoadingProps {
  message?: string;
  className?: string;
}

export const MobileLoading = ({ message = 'Carregando...', className }: MobileLoadingProps) => {
  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-background p-4",
      className
    )}>
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-primary/40 rounded-full animate-spin mx-auto animation-delay-150" 
               style={{ animationDirection: 'reverse' }} />
        </div>
        <p className="text-sm text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
};