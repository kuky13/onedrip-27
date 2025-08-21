import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, SortAsc, SortDesc, Filter, X } from 'lucide-react';
export interface TrashFilters {
  search: string;
  sortBy: 'date' | 'name' | 'value' | 'expiration';
  sortOrder: 'asc' | 'desc';
  deviceType: string;
  expirationFilter: 'all' | 'expiring' | 'recent';
}
interface TrashFiltersProps {
  filters: TrashFilters;
  onFiltersChange: (filters: TrashFilters) => void;
  totalCount: number;
  filteredCount: number;
  deviceTypes: string[];
}
export const TrashFiltersComponent: React.FC<TrashFiltersProps> = ({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
  deviceTypes
}) => {
  const updateFilter = (key: keyof TrashFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };
  const toggleSortOrder = () => {
    onFiltersChange({
      ...filters,
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
    });
  };
  const clearFilters = () => {
    onFiltersChange({
      search: '',
      sortBy: 'date',
      sortOrder: 'desc',
      deviceType: 'all',
      expirationFilter: 'all'
    });
  };
  const hasActiveFilters = filters.search || filters.deviceType && filters.deviceType !== 'all' || filters.expirationFilter !== 'all';
  return <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 safari-safe-transform h-4 w-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Buscar por dispositivo, cliente ou motivo..." 
              value={filters.search} 
              onChange={e => updateFilter('search', e.target.value)} 
              className="pl-10 safari-safe-input" 
            />
          </div>

          {/* Filtros e ordenação */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Ordenação */}
            <div className="flex items-center gap-2">
              <Select value={filters.sortBy} onValueChange={value => updateFilter('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Data de exclusão</SelectItem>
                  <SelectItem value="name">Nome do dispositivo</SelectItem>
                  <SelectItem value="value">Valor</SelectItem>
                  <SelectItem value="expiration">Dias restantes</SelectItem>
                </SelectContent>
              </Select>
              
              
            </div>

            {/* Filtro por tipo de dispositivo */}
            <Select value={filters.deviceType} onValueChange={value => updateFilter('deviceType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de dispositivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {deviceTypes.map(type => <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>)}
              </SelectContent>
            </Select>

            {/* Filtro por expiração */}
            <Select value={filters.expirationFilter} onValueChange={value => updateFilter('expirationFilter', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por expiração" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="expiring">Expirando (≤7 dias)</SelectItem>
                <SelectItem value="recent">Excluídos recentemente</SelectItem>
              </SelectContent>
            </Select>

            {/* Limpar filtros */}
            {hasActiveFilters && <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Limpar
              </Button>}
          </div>

          {/* Contador e filtros ativos */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                {filteredCount === totalCount ? `${totalCount} item(s) na lixeira` : `${filteredCount} de ${totalCount} item(s)`}
              </span>
              
              {hasActiveFilters && <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filtros ativos:</span>
                  {filters.search && <Badge variant="secondary" className="text-xs">
                      Busca: "{filters.search}"
                    </Badge>}
                  {filters.deviceType && <Badge variant="secondary" className="text-xs">
                      Tipo: {filters.deviceType}
                    </Badge>}
                  {filters.expirationFilter !== 'all' && <Badge variant="secondary" className="text-xs">
                      {filters.expirationFilter === 'expiring' ? 'Expirando' : 'Recentes'}
                    </Badge>}
                </div>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};