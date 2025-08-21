
import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

interface BudgetBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const BudgetBreadcrumbs = ({ items, className }: BudgetBreadcrumbsProps) => {
  return (
    <nav 
      className={cn("flex items-center space-x-1 text-sm", className)}
      aria-label="Navegação"
    >
      <div className="flex items-center">
        <Home className="w-4 h-4 text-muted-foreground" />
      </div>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className={cn(
                "text-muted-foreground hover:text-foreground transition-colors ml-1",
                {
                  "text-foreground font-medium": item.active,
                }
              )}
            >
              {item.label}
            </button>
          ) : (
            <span
              className={cn(
                "text-muted-foreground ml-1",
                {
                  "text-foreground font-medium": item.active,
                }
              )}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};
