import React, { useState, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { 
  Search, 
  Filter, 
  X, 
  CalendarDays, 
  DollarSign, 
  Smartphone, 
  User, 
  Settings,
  SlidersHorizontal,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FilterState {
  searchTerm: string;
  status: string;
  priceRange: {
    min: number;
    max: number;
  };
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  deviceType: string;
  clientName: string;
}

interface BudgetSearchAdvancedProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  totalResults: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export const BudgetSearchAdvanced = ({
  searchTerm,
  onSearchTermChange,
  onFiltersChange,
  totalResults,
  hasActiveFilters,
  onClearFilters
}: BudgetSearchAdvancedProps) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    status: '',
    priceRange: { min: 0, max: 0 },
    dateRange: { from: null, to: null },
    deviceType: '',
    clientName: ''
  });

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange({ [key]: value });
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    const emptyFilters: FilterState = {
      searchTerm: '',
      status: '',
      priceRange: { min: 0, max: 0 },
      dateRange: { from: null, to: null },
      deviceType: '',
      clientName: ''
    };
    setFilters(emptyFilters);
    onSearchTermChange('');
    onClearFilters();
  }, [onSearchTermChange, onClearFilters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filters.status) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.deviceType) count++;
    if (filters.clientName) count++;
    return count;
  }, [searchTerm, filters]);

  const statusOptions = [
    { value: 'pending', label: 'Pendente', color: 'bg-yellow-500' },
    { value: 'approved', label: 'Aprovado', color: 'bg-blue-500' },
    { value: 'rejected', label: 'Rejeitado', color: 'bg-red-500' },
    { value: 'paid', label: 'Pago', color: 'bg-green-500' },
    { value: 'delivered', label: 'Entregue', color: 'bg-purple-500' }
  ];

  const deviceTypes = [
    'Smartphone',
    'Tablet',
    'Notebook',
    'Desktop',
    'Smartwatch',
    'Acessório',
    'Outro'
  ];

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, dispositivo, problema..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10 pr-20 h-12 text-base bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200"
          />
          
          {/* Advanced Filters Toggle */}
          <div className="absolute right-2 flex items-center gap-2">
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchTermChange('')}
                className="h-8 w-8 p-0 hover:bg-muted/50"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 gap-2 transition-all duration-200",
                    activeFiltersCount > 0 && "border-primary bg-primary/10 text-primary"
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              
              <PopoverContent className="w-96 p-0" align="end">
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Filtros Avançados</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAdvancedOpen(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      Status do Orçamento
                    </label>
                    <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", status.color)} />
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Device Type Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      Tipo de Dispositivo
                    </label>
                    <Select value={filters.deviceType} onValueChange={(value) => updateFilter('deviceType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Client Name Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Nome do Cliente
                    </label>
                    <Input
                      placeholder="Digite o nome do cliente"
                      value={filters.clientName}
                      onChange={(e) => updateFilter('clientName', e.target.value)}
                      className="h-9"
                    />
                  </div>

                  {/* Price Range Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      Faixa de Preço (R$)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Mín"
                        value={filters.priceRange.min || ''}
                        onChange={(e) => updateFilter('priceRange', {
                          ...filters.priceRange,
                          min: Number(e.target.value) || 0
                        })}
                        className="h-9"
                      />
                      <Input
                        type="number"
                        placeholder="Máx"
                        value={filters.priceRange.max || ''}
                        onChange={(e) => updateFilter('priceRange', {
                          ...filters.priceRange,
                          max: Number(e.target.value) || 0
                        })}
                        className="h-9"
                      />
                    </div>
                  </div>

                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      Período de Criação
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-9 justify-start text-left font-normal">
                            {filters.dateRange.from ? 
                              format(filters.dateRange.from, 'dd/MM', { locale: ptBR }) : 
                              'Data inicial'
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.dateRange.from || undefined}
                            onSelect={(date) => updateFilter('dateRange', {
                              ...filters.dateRange,
                              from: date || null
                            })}
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-9 justify-start text-left font-normal">
                            {filters.dateRange.to ? 
                              format(filters.dateRange.to, 'dd/MM', { locale: ptBR }) : 
                              'Data final'
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.dateRange.to || undefined}
                            onSelect={(date) => updateFilter('dateRange', {
                              ...filters.dateRange,
                              to: date || null
                            })}
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      className="flex-1"
                      disabled={activeFiltersCount === 0}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                    <Button
                      onClick={() => setIsAdvancedOpen(false)}
                      className="flex-1"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Aplicar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Results Summary & Active Filters */}
      {(activeFiltersCount > 0 || totalResults > 0) && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}</span>
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{searchTerm}"
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onSearchTermChange('')}
              />
            </Badge>
          )}
          
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusOptions.find(s => s.value === filters.status)?.label}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => updateFilter('status', '')}
              />
            </Badge>
          )}

          {filters.deviceType && (
            <Badge variant="secondary" className="gap-1">
              Tipo: {filters.deviceType}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => updateFilter('deviceType', '')}
              />
            </Badge>
          )}

          {filters.clientName && (
            <Badge variant="secondary" className="gap-1">
              Cliente: {filters.clientName}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => updateFilter('clientName', '')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};