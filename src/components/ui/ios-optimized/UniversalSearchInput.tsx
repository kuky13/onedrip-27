
import React, { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UniversalSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onFilterToggle?: () => void;
  placeholder?: string;
  className?: string;
  showFilter?: boolean;
  hasActiveFilters?: boolean;
  id?: string;
}

export const UniversalSearchInput = ({ 
  value, 
  onChange, 
  onClear, 
  onFilterToggle,
  placeholder = "Buscar...",
  className = "",
  showFilter = false,
  hasActiveFilters = false,
  id
}: UniversalSearchInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={cn("relative group", className)}>
      <div className={cn(
        "relative flex items-center transition-all duration-300 ease-out",
        "bg-background/80 backdrop-blur-sm border rounded-2xl",
        isFocused 
          ? "border-primary/50 shadow-lg shadow-primary/10 bg-background" 
          : "border-border/30 hover:border-border/50"
      )}>
        <Search className={cn(
          "absolute left-4 h-5 w-5 transition-colors duration-200",
          isFocused ? "text-primary" : "text-muted-foreground/70"
        )} />
        
        <input
          id={id}
          type="search"
          inputMode="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-12 pr-16 py-4 bg-transparent text-foreground",
            "placeholder-muted-foreground/60 focus:outline-none",
            "transition-all duration-200"
          )}
          style={{ 
            fontSize: '16px',
            WebkitAppearance: 'none',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
          }}
        />
        
        <div className="absolute right-2 flex items-center gap-1">
          {showFilter && (
            <button
              type="button"
              onClick={onFilterToggle}
              className={cn(
                "p-2 rounded-full transition-all duration-200 active:scale-95",
                hasActiveFilters 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "hover:bg-muted/50 text-muted-foreground"
              )}
              style={{ touchAction: 'manipulation' }}
            >
              <Filter className="h-4 w-4" />
            </button>
          )}
          
          {value && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground/70 hover:text-foreground transition-all duration-200 active:scale-95"
              style={{ touchAction: 'manipulation' }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Focus ring indicator */}
      <div className={cn(
        "absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none",
        isFocused ? "ring-2 ring-primary/20 ring-offset-2 ring-offset-background" : ""
      )} />
    </div>
  );
};
