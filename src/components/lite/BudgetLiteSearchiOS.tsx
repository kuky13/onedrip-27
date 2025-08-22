import React from 'react';
import { Search, X } from 'lucide-react';

interface BudgetLiteSearchiOSProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
}

export const BudgetLiteSearchiOS = ({
  searchTerm,
  onSearchChange,
  onClearSearch
}: BudgetLiteSearchiOSProps) => {
  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-5 w-5 text-muted-foreground/70" />
        <input
          type="search"
          inputMode="search"
          placeholder="Buscar por cliente, dispositivo ou serviço..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-12 py-4 bg-background border border-border/50 rounded-2xl text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
          style={{ 
            fontSize: '16px', // Previne zoom no iOS
            WebkitAppearance: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
        />
        {searchTerm && (
          <button
            onClick={onClearSearch}
            className="absolute right-4 p-1 text-muted-foreground/70 hover:text-foreground active:scale-90 transition-all duration-150"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};