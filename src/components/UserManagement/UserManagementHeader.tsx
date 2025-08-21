
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { DebugInfo } from '@/types/user';

interface Props {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debugInfo: DebugInfo | null;
  showDebugInfo: boolean;
  setShowDebugInfo: (show: boolean) => void;
}

export const UserManagementHeader = ({ searchTerm, setSearchTerm, debugInfo, showDebugInfo, setShowDebugInfo }: Props) => (
  <CardHeader>
    <CardTitle className="flex flex-col md:flex-row items-stretch md:items-center md:justify-between gap-4">
      <span>Gerenciar Usuários</span>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {debugInfo && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="text-xs"
          >
            {showDebugInfo ? 'Ocultar' : 'Mostrar'} Debug
          </Button>
        )}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 safari-safe-transform h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full safari-safe-input"
          />
        </div>
      </div>
    </CardTitle>
  </CardHeader>
);
