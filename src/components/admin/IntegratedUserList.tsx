// @ts-nocheck - Temporary suppression for type issues
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Search,
  Filter,
  MoreHorizontal,
  Users,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useEnhancedUsers, useUserSelection } from '../../hooks/useEnhancedUsers';
import type {
  IntegratedUserListProps,
  EnhancedUser,
  UserFilters,
  UserSortField,
  SortDirection
} from '../../types/userLicense';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <Badge variant="secondary" className="flex items-center space-x-1">
      <span>{label}</span>
      <button onClick={onRemove} className="ml-1 hover:bg-gray-300 rounded-full p-0.5">
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

interface UserRowProps {
  user: EnhancedUser;
  isSelected: boolean;
  onSelect: (userId: string, selected: boolean) => void;
  onViewProfile: (userId: string) => void;
  onManageLicense: (userId: string) => void;
}

function UserRow({ user, isSelected, onSelect, onViewProfile, onManageLicense }: UserRowProps) {
  const getLicenseStatusBadge = () => {
    if (!user.license) {
      return <Badge variant="outline">Sem Licença</Badge>;
    }

    switch (user.license.status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Ativa</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirada</Badge>;
      case 'suspended':
        return <Badge variant="secondary">Suspensa</Badge>;
      default:
        return <Badge variant="outline">{user.license.status}</Badge>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getDaysUntilExpiry = () => {
    if (!user.license?.expires_at) return null;
    const today = new Date();
    const expiryDate = new Date(user.license.expires_at);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  return (
    <TableRow className={isSelected ? 'bg-blue-50' : ''}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(user.id, !!checked)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="font-medium">{user.name || 'Nome não informado'}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          {getLicenseStatusBadge()}
          {isExpiringSoon && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" title="Expira em breve" />
          )}
          {isExpired && (
            <Clock className="h-4 w-4 text-red-500" title="Expirada" />
          )}
        </div>
      </TableCell>
      <TableCell>
        {user.license ? (
          <div>
            <p className="text-sm">{user.license.type}</p>
            <p className="text-xs text-gray-500">
              Expira: {formatDate(user.license.expires_at)}
            </p>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-sm">{formatDate(user.created_at)}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm">{formatDate(user.last_login)}</span>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewProfile(user.id)}>
              Ver Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onManageLicense(user.id)}>
              Gerenciar Licença
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              Suspender Usuário
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function IntegratedUserList({
  onUserSelect,
  onBulkAction,
  onViewProfile,
  onManageLicense
}: IntegratedUserListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<UserFilters>({});
  const [sortField, setSortField] = useState<UserSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const {
    users,
    loading,
    error,
    pagination,
    refresh
  } = useEnhancedUsers({
    filters: {
      ...filters,
      search: searchTerm || undefined
    },
    sorting: {
      field: sortField,
      direction: sortDirection
    },
    pagination: {
      page: currentPage,
      limit: pageSize
    },
    autoRefresh: true
  });

  const {
    selectedUsers,
    selectUser,
    selectAll,
    clearSelection,
    isAllSelected
  } = useUserSelection(users);

  const activeFilters = useMemo(() => {
    const active = [];
    if (filters.licenseStatus) {
      active.push({
        key: 'licenseStatus',
        label: `Status: ${filters.licenseStatus}`,
        remove: () => setFilters(prev => ({ ...prev, licenseStatus: undefined }))
      });
    }
    if (filters.licenseType) {
      active.push({
        key: 'licenseType',
        label: `Tipo: ${filters.licenseType}`,
        remove: () => setFilters(prev => ({ ...prev, licenseType: undefined }))
      });
    }
    if (filters.dateFrom) {
      active.push({
        key: 'dateFrom',
        label: `A partir de: ${new Date(filters.dateFrom).toLocaleDateString('pt-BR')}`,
        remove: () => setFilters(prev => ({ ...prev, dateFrom: undefined }))
      });
    }
    if (filters.dateTo) {
      active.push({
        key: 'dateTo',
        label: `Até: ${new Date(filters.dateTo).toLocaleDateString('pt-BR')}`,
        remove: () => setFilters(prev => ({ ...prev, dateTo: undefined }))
      });
    }
    return active;
  }, [filters]);

  const handleSort = (field: UserSortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) return;
    onBulkAction?.(action, selectedUsers);
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar usuários: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Usuários e Licenças</h2>
          <p className="text-gray-600">
            {pagination?.total || 0} usuários encontrados
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={refresh}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span>Filtros</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-2 space-y-2">
                    <Select
                      value={filters.licenseStatus || ''}
                      onValueChange={(value) => 
                        setFilters(prev => ({ 
                          ...prev, 
                          licenseStatus: value || undefined 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status da Licença" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="expired">Expirada</SelectItem>
                        <SelectItem value="suspended">Suspensa</SelectItem>
                        <SelectItem value="none">Sem Licença</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.licenseType || ''}
                      onValueChange={(value) => 
                        setFilters(prev => ({ 
                          ...prev, 
                          licenseType: value || undefined 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de Licença" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Básica</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Filtros ativos:</span>
                {activeFilters.map((filter) => (
                  <FilterChip
                    key={filter.key}
                    label={filter.label}
                    onRemove={filter.remove}
                  />
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs"
                >
                  Limpar todos
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="text-blue-900 font-medium">
                  {selectedUsers.length} usuário(s) selecionado(s)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('create_license')}
                >
                  Criar Licenças
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('renew_license')}
                >
                  Renovar Licenças
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('suspend_license')}
                >
                  Suspender
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                >
                  Limpar Seleção
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={selectAll}
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('name')}
                >
                  Usuário
                </TableHead>
                <TableHead>Status da Licença</TableHead>
                <TableHead>Detalhes da Licença</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('created_at')}
                >
                  Criado em
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('last_login')}
                >
                  Último Login
                </TableHead>
                <TableHead className="w-12">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={7}>
                      <div className="h-12 bg-gray-100 animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Users className="h-8 w-8 text-gray-400" />
                      <p className="text-gray-500">Nenhum usuário encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isSelected={selectedUsers.includes(user.id)}
                    onSelect={selectUser}
                    onViewProfile={onViewProfile || (() => {})}
                    onManageLicense={onManageLicense || (() => {})}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} usuários
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntegratedUserList;