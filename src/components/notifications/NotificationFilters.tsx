import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NotificationFilters } from '@/hooks/useNotifications';

interface NotificationFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: NotificationFilters;
  onFiltersChange: (filters: Partial<NotificationFilters>) => void;
  onClearFilters: () => void;
  className?: string;
}

export const NotificationFiltersComponent: React.FC<NotificationFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearFilters,
  className
}) => {
  const hasActiveFilters = filters.type !== 'all' || filters.read_status !== 'all' || searchTerm.length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou mensagem..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onSearchChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {/* Filter Selects */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.type || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ type: value as 'info' | 'warning' | 'success' | 'error' | 'all' })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="info">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Info
              </div>
            </SelectItem>
            <SelectItem value="success">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success-600 rounded-full" />
                Sucesso
              </div>
            </SelectItem>
            <SelectItem value="warning">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-warning-600 rounded-full" />
                Aviso
              </div>
            </SelectItem>
            <SelectItem value="error">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-destructive rounded-full" />
                Erro
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={filters.read_status || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ read_status: value as 'read' | 'unread' | 'all' })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="unread">Não lidas</SelectItem>
            <SelectItem value="read">Lidas</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {searchTerm && (
            <Badge variant="secondary" className="text-xs">
              Busca: "{searchTerm}"
            </Badge>
          )}
          {filters.type !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Tipo: {filters.type}
            </Badge>
          )}
          {filters.read_status !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Status: {filters.read_status === 'read' ? 'Lidas' : 'Não lidas'}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};