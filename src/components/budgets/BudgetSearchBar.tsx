
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from '@/components/ui/icons';

interface BudgetSearchBarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onSearch: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export const BudgetSearchBar = ({
  searchTerm,
  onSearchTermChange,
  onSearch,
  onKeyPress
}: BudgetSearchBarProps) => {
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);

  return (
    <Card className="glass-card border-0 bg-white/50 dark:bg-black/50 safari-safe-blur animate-scale-in">
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 safari-safe-transform h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type={isIOS ? "text" : "search"}
              inputMode={isIOS ? "text" : "search"}
              autoComplete="off"
              spellCheck={false}
              autoFocus={false}
              aria-label="Buscar por cliente, dispositivo ou problema"
              placeholder="Buscar por cliente, dispositivo ou problema..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              onKeyDown={onKeyPress}
              className="pl-12 h-12 rounded-2xl border-white/20 bg-white/50 dark:bg-black/50 text-base lg:text-sm focus:ring-[#fec832] focus:border-[#fec832] safari-safe-input"
            />
          </div>
          <Button
            onClick={onSearch}
            size="sm"
            className="h-12 px-6 bg-[#fec832] hover:bg-[#fec832]/90 text-black rounded-2xl font-medium shadow-lg hover:shadow-xl safari-safe-transition safari-safe-scale"
          >
            <Search className="h-5 w-5 lg:mr-2" />
            <span className="hidden lg:inline">Buscar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
