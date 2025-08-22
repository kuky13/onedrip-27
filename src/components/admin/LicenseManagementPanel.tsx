import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Key,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Copy,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Trash2,
  Eye,
  Settings,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LicenseEditModal } from '@/components/license/LicenseEditModal';
import { LicenseCreateModal } from './LicenseCreateModal';
import { LicenseHistoryModal } from './LicenseHistoryModal';

interface License {
  id: string;
  code: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  activated_at: string | null;
  last_validation: string | null;
}

type FilterStatus = 'all' | 'active' | 'expired' | 'expiring' | 'inactive' | 'unassigned';
type SortField = 'code' | 'user_name' | 'expires_at' | 'created_at' | 'status';
type SortOrder = 'asc' | 'desc';

export const LicenseManagementPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  // Fetch licenses
  const { data: licenses, isLoading, refetch } = useQuery({
    queryKey: ['admin-licenses'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_licenses_with_users');
      if (error) throw error;
      return data as License[];
    },
    refetchInterval: 30000,
  });

  // Bulk actions mutations
  const bulkActivateMutation = useMutation({
    mutationFn: async (licenseIds: string[]) => {
      const { error } = await supabase.rpc('admin_bulk_activate_licenses', {
        p_license_ids: licenseIds
      });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess({
        title: 'Licenças Ativadas!',
        description: `${selectedLicenses.length} licenças foram ativadas.`
      });
      setSelectedLicenses([]);
      queryClient.invalidateQueries({ queryKey: ['admin-licenses'] });
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao Ativar',
        description: error.message
      });
    }
  });

  const bulkDeactivateMutation = useMutation({
    mutationFn: async (licenseIds: string[]) => {
      const { error } = await supabase.rpc('admin_bulk_deactivate_licenses', {
        p_license_ids: licenseIds
      });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess({
        title: 'Licenças Desativadas!',
        description: `${selectedLicenses.length} licenças foram desativadas.`
      });
      setSelectedLicenses([]);
      queryClient.invalidateQueries({ queryKey: ['admin-licenses'] });
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao Desativar',
        description: error.message
      });
    }
  });

  // Filter and sort licenses
  const filteredAndSortedLicenses = useMemo(() => {
    if (!licenses) return [];
    
    let filtered = licenses.filter((license) => {
      // Search filter
      const matchesSearch = 
        license.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Status filter
      switch (filterStatus) {
        case 'active':
          return license.is_active && (!license.expires_at || new Date(license.expires_at) > new Date());
        case 'expired':
          return license.expires_at && new Date(license.expires_at) <= new Date();
        case 'expiring':
          if (!license.expires_at) return false;
          const expirationDate = new Date(license.expires_at);
          const weekFromNow = new Date();
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          return expirationDate <= weekFromNow && expirationDate > new Date();
        case 'inactive':
          return !license.is_active;
        case 'unassigned':
          return !license.user_id;
        default:
          return true;
      }
    });
    
    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'status') {
        aValue = getStatusPriority(a);
        bValue = getStatusPriority(b);
      } else if (sortField === 'expires_at' || sortField === 'created_at') {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [licenses, searchTerm, filterStatus, sortField, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    if (!licenses) return {
      total: 0,
      active: 0,
      expired: 0,
      expiring: 0,
      unassigned: 0
    };
    
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    return {
      total: licenses.length,
      active: licenses.filter(l => l.is_active && (!l.expires_at || new Date(l.expires_at) > now)).length,
      expired: licenses.filter(l => l.expires_at && new Date(l.expires_at) <= now).length,
      expiring: licenses.filter(l => {
        if (!l.expires_at) return false;
        const expirationDate = new Date(l.expires_at);
        return expirationDate <= weekFromNow && expirationDate > now;
      }).length,
      unassigned: licenses.filter(l => !l.user_id).length
    };
  }, [licenses]);

  const getStatusPriority = (license: License) => {
    if (!license.is_active) return 4; // Inactive
    if (!license.expires_at) return 1; // Active no expiration
    const now = new Date();
    const expirationDate = new Date(license.expires_at);
    if (expirationDate <= now) return 5; // Expired
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    if (expirationDate <= weekFromNow) return 3; // Expiring
    return 2; // Active
  };

  const getStatusBadge = (license: License) => {
    if (!license.is_active) {
      return <Badge variant="secondary">Inativa</Badge>;
    }
    
    if (!license.expires_at) {
      return <Badge variant="default">Ativa (Sem Expiração)</Badge>;
    }
    
    const now = new Date();
    const expirationDate = new Date(license.expires_at);
    
    if (expirationDate <= now) {
      return <Badge variant="destructive">Expirada</Badge>;
    }
    
    const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 7) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">
        Expira em {daysLeft}d
      </Badge>;
    }
    
    return <Badge variant="default">Ativa</Badge>;
  };

  const handleSelectAll = () => {
    if (selectedLicenses.length === filteredAndSortedLicenses.length) {
      setSelectedLicenses([]);
    } else {
      setSelectedLicenses(filteredAndSortedLicenses.map(l => l.id));
    }
  };

  const handleSelectLicense = (licenseId: string) => {
    setSelectedLicenses(prev => 
      prev.includes(licenseId) 
        ? prev.filter(id => id !== licenseId)
        : [...prev, licenseId]
    );
  };

  const handleEdit = (license: License) => {
    setSelectedLicense(license);
    setEditModalOpen(true);
  };

  const handleViewHistory = (license: License) => {
    setSelectedLicense(license);
    setHistoryModalOpen(true);
  };

  const copyLicenseCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showSuccess({
      title: 'Copiado!',
      description: 'Código da licença copiado para a área de transferência.'
    });
  };

  const exportLicenses = () => {
    const csvData = filteredAndSortedLicenses.map(license => ({
      'Código': license.code,
      'Usuário': license.user_name || 'Não atribuída',
      'Email': license.user_email || '',
      'Status': license.is_active ? 'Ativa' : 'Inativa',
      'Expira em': license.expires_at ? format(new Date(license.expires_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Sem expiração',
      'Criada em': format(new Date(license.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    }));
    
    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `licencas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess({
      title: 'Exportado!',
      description: `${csvData.length} licenças exportadas com sucesso.`
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando licenças...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Licenças</h2>
          <p className="text-muted-foreground">
            Gerencie todas as licenças do sistema com controle total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportLicenses}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Licença
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Key className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-lg font-semibold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Expiradas</p>
                <p className="text-lg font-semibold">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Expirando</p>
                <p className="text-lg font-semibold">{stats.expiring}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Não Atribuídas</p>
                <p className="text-lg font-semibold">{stats.unassigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, usuário ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="expired">Expiradas</SelectItem>
                  <SelectItem value="expiring">Expirando</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                  <SelectItem value="unassigned">Não Atribuídas</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortField(field as SortField);
                setSortOrder(order as SortOrder);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Mais Recentes</SelectItem>
                  <SelectItem value="created_at-asc">Mais Antigas</SelectItem>
                  <SelectItem value="code-asc">Código A-Z</SelectItem>
                  <SelectItem value="code-desc">Código Z-A</SelectItem>
                  <SelectItem value="user_name-asc">Usuário A-Z</SelectItem>
                  <SelectItem value="user_name-desc">Usuário Z-A</SelectItem>
                  <SelectItem value="expires_at-asc">Expira Primeiro</SelectItem>
                  <SelectItem value="expires_at-desc">Expira Último</SelectItem>
                  <SelectItem value="status-asc">Status</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedLicenses.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedLicenses.length} licença(s) selecionada(s)
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkActivateMutation.mutate(selectedLicenses)}
                    disabled={bulkActivateMutation.isPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Ativar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkDeactivateMutation.mutate(selectedLicenses)}
                    disabled={bulkDeactivateMutation.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Desativar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedLicenses([])}
                  >
                    Limpar Seleção
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Licenses Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedLicenses.length === filteredAndSortedLicenses.length && filteredAndSortedLicenses.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="w-12">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedLicenses.map((license) => (
                <TableRow key={license.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLicenses.includes(license.id)}
                      onCheckedChange={() => handleSelectLicense(license.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {license.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLicenseCode(license.code)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {license.user_name ? (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{license.user_name}</p>
                          <p className="text-sm text-muted-foreground">{license.user_email}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Não atribuída</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(license)}
                  </TableCell>
                  <TableCell>
                    {license.expires_at ? (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(license.expires_at), 'dd/MM/yyyy HH:mm', {
                            locale: ptBR
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sem expiração</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(license.created_at), 'dd/MM/yyyy', {
                      locale: ptBR
                    })}
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
                        <DropdownMenuItem onClick={() => handleEdit(license)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewHistory(license)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Histórico
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyLicenseCode(license.code)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar Código
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredAndSortedLicenses.length === 0 && (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm || filterStatus !== 'all' ? 'Nenhuma licença encontrada' : 'Nenhuma licença cadastrada'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Crie sua primeira licença para começar.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <LicenseEditModal
        license={selectedLicense ? {
          ...selectedLicense,
          license_code: selectedLicense.code,
          activated_at: selectedLicense.activated_at || '',
          notes: ''
        } : null}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedLicense(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-licenses'] });
        }}
      />
      
      <LicenseCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
      
      <LicenseHistoryModal
        license={selectedLicense}
        isOpen={historyModalOpen}
        onClose={() => {
          setHistoryModalOpen(false);
          setSelectedLicense(null);
        }}
      />
    </div>
  );
};