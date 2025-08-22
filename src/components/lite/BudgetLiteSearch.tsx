import React, { useState, useEffect } from 'react';
import { MessageCircle, FileText, Edit, Trash2, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BudgetLiteSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClearSearch: () => void;
}

export const BudgetLiteSearch = ({ 
  searchTerm, 
  onSearchChange, 
  onClearSearch 
}: BudgetLiteSearchProps) => {
  return (
    <div className="bg-card border rounded-lg p-3 mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          inputMode="search"
          placeholder="Buscar por cliente, dispositivo..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-9 py-2 bg-background border border-border rounded-md text-sm"
        />
        {searchTerm && (
          <button
            onClick={onClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted rounded"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};