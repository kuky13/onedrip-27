import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput = ({ 
  value, 
  onChange, 
  onClear, 
  placeholder = "Buscar...",
  className = ""
}: SearchInputProps) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
        inputMode="search"
        autoComplete="off"
        autoFocus={false}
        style={{
          WebkitAppearance: 'none',
          fontSize: '16px' // Prevents iOS zoom on focus
        }}
      />
      {value && onClear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          style={{ touchAction: 'manipulation' }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};