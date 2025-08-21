import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  Filter, 
  Download, 
  Users, 
  UserCheck, 
  UserX, 
  Calendar,
  Grid3X3,
  List,
  MoreHorizontal,
  Trash2,
  Edit,
  CalendarClock,
  Shield,
  User as UserIcon,
  Crown,
  RefreshCw,
  BarChart3,
  Activity,
  Cog,
  Key,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { User } from '@/types/user';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserEditModal } from '@/components/UserEditModal';
import { UserDeletionDialog } from './UserDeletionDialog';
import { UserRenewalDialog } from './UserRenewalDialog';
import { UserAnalytics } from './UserAnalytics';
import { UserActivityHistory } from './UserActivityHistory';
import { UserSettings } from './UserSettings';

type ViewMode = 'table' | 'cards';
type FilterRole = 'all' | 'admin' | 'manager' | 'user';
type FilterStatus = 'all' | 'active' | 'inactive';
type SortBy = 'name' | 'created_at' | 'last_sign_in_at' | 'budget_count';
type SortOrder = 'asc' | 'desc';

export const EnhancedUserManagement = () => {
  const {
    searchTerm,
    setSearchTerm,
    selectedUser,
    setSelectedUser,
    isEditModalOpen,
    setIsEditModalOpen,
    userToDelete,
    setUserToDelete,
    userToRenew,
    setUserToRenew,
    debugInfo,
    isLoading,
    error,
    deleteUserMutation,
    filteredUsers: baseFilteredUsers,
    handleEdit,
    handleDelete,
    handleRenew,
    confirmDelete,
    queryClient
  } = useUserManagement();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filterRole, setFilterRole] = useState<FilterRole>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [showLicenseCodes, setShowLicenseCodes] = useState(false);
  const [copiedLicense, setCopiedLicense] = useState<string | null>(null);

  // Filtros e ordenação avançados
  const filteredAndSortedUsers = useMemo(() => {
    let users = [...(baseFilteredUsers || [])];

    // Filtro por role
    if (filterRole !== 'all') {
      users = users.filter(user => user.role === filterRole);
    }

    // Filtro por status
    if (filterStatus !== 'all') {
      users = users.filter(user => {
        const isActive = user.license_active;
        return filterStatus === 'active' ? isActive : !isActive;
      });
    }

    // Ordenação
    users.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'last_sign_in_at') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return users;
  }, [baseFilteredUsers, filterRole, filterStatus, sortBy, sortOrder]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = baseFilteredUsers?.length || 0;
    const active = baseFilteredUsers?.filter(u => u.license_active).length || 0;
    const admins = baseFilteredUsers?.filter(u => u.role === 'admin').length || 0;
    const managers = baseFilteredUsers?.filter(u => u.role === 'manager').length || 0;
    const totalBudgets = baseFilteredUsers?.reduce((sum, u) => sum + u.budget_count, 0) || 0;

    return { total, active, inactive: total - active, admins, managers, totalBudgets };
  }, [baseFilteredUsers]);

  const getRoleBadge = (role: string) => {
    const configs = {
      admin: { color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', icon: Shield, label: 'Admin' },
      manager: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', icon: Crown, label: 'Gerente' },
      user: { color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', icon: UserIcon, label: 'Usuário' },
    };
    return configs[role as keyof typeof configs] || configs.user;
  };

  const getStatusBadge = (user: User) => {
    if (user.license_active) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Ativo</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Inativo</Badge>;
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredAndSortedUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Função para gerar CSV
  const generateCSV = (users: User[]) => {
    return [
      ['Nome', 'Email', 'Função', 'Status', 'Código da Licença', 'Licença Expira', 'Licença Ativada', 'Orçamentos', 'Criado em', 'Último login'].join(','),
      ...users.map(user => [
        user.name,
        user.email,
        user.role === 'admin' ? 'Administrador' : user.role === 'manager' ? 'Gerente' : 'Usuário',
        user.license_active ? 'Ativo' : 'Inativo',
        user.license_code || 'N/A',
        user.license_expires_at ? format(new Date(user.license_expires_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A',
        user.license_activated_at ? format(new Date(user.license_activated_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A',
        user.budget_count,
        format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR }),
        user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Nunca'
      ].join(','))
    ].join('\n');
  };

  // Função para download de CSV
  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // Função para exportar dados selecionados
  const exportSelectedUsers = () => {
    const selectedUserData = filteredAndSortedUsers.filter(user => selectedUsers.includes(user.id));
    const csvContent = generateCSV(selectedUserData);
    downloadCSV(csvContent, 'usuarios_selecionados.csv');
    toast.success(`${selectedUserData.length} usuários exportados com sucesso!`);
  };

  // Função para exportar todos os usuários
  const exportAllUsers = () => {
    const csvContent = generateCSV(filteredAndSortedUsers);
    downloadCSV(csvContent, 'todos_usuarios.csv');
    toast.success(`${filteredAndSortedUsers.length} usuários exportados com sucesso!`);
  };

  // Função para importar usuários
  const importUsers = (file: File) => {
    // Implementar lógica de importação
    toast.success('Funcionalidade de importação será implementada em breve');
  };

  // Função para backup de dados
  const backupData = () => {
    // Implementar lógica de backup
    toast.success('Backup iniciado com sucesso');
  };

  // Função para limpeza de usuários inativos
  const cleanupInactiveUsers = () => {
    // Implementar lógica de limpeza
    toast.success('Limpeza de usuários inativos iniciada');
  };

  const exportUsers = () => {
    const usersToExport = selectedUsers.length > 0 
      ? filteredAndSortedUsers.filter(u => selectedUsers.includes(u.id))
      : filteredAndSortedUsers;

    const csvContent = generateCSV(usersToExport);
    downloadCSV(csvContent, `usuarios_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  // Função para copiar código da licença
  const copyLicenseCode = async (licenseCode: string) => {
    try {
      await navigator.clipboard.writeText(licenseCode);
      setCopiedLicense(licenseCode);
      toast.success('Código da licença copiado!');
      setTimeout(() => setCopiedLicense(null), 2000);
    } catch (error) {
      toast.error('Erro ao copiar código da licença');
    }
  };

  // Função para alternar visibilidade dos códigos de licença
  const toggleLicenseVisibility = () => {
    setShowLicenseCodes(!showLicenseCodes);
  };

  if (!debugInfo?.is_admin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
          <p className="text-muted-foreground">Você não tem permissões para acessar esta área.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p>Carregando usuários...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <UserX className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar usuários</h3>
          <p className="text-muted-foreground mb-4">{typeof error === 'string' ? error : (error as Error)?.message || 'Erro ao carregar usuários'}</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho principal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, analise dados e configure o sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportAllUsers}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Todos
          </Button>
          {selectedUsers.length > 0 && (
            <Button variant="outline" onClick={exportSelectedUsers}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Selecionados ({selectedUsers.length})
            </Button>
          )}
        </div>
      </div>

      {/* Sistema de abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Análises
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Atividades
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Aba de Usuários */}
        <TabsContent value="users" className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <UserCheck className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{stats.active}</div>
                <div className="text-sm text-muted-foreground">Ativos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <UserX className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <div className="text-2xl font-bold">{stats.inactive}</div>
                <div className="text-sm text-muted-foreground">Inativos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <div className="text-2xl font-bold">{stats.admins}</div>
                <div className="text-sm text-muted-foreground">Admins</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Crown className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{stats.managers}</div>
                <div className="text-sm text-muted-foreground">Gerentes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{stats.totalBudgets}</div>
                <div className="text-sm text-muted-foreground">Orçamentos</div>
              </CardContent>
            </Card>
          </div>

          {/* Controles principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <span>Gerenciar Usuários</span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                  {/* Busca */}
                  <div className="relative flex-grow lg:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar usuários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Botões de ação */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="h-4 w-4 mr-1" />
                      Filtros
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportUsers}
                      disabled={filteredAndSortedUsers.length === 0}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Exportar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleLicenseVisibility}
                      title={showLicenseCodes ? 'Ocultar códigos de licença' : 'Mostrar códigos de licença'}
                    >
                      {showLicenseCodes ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                      {showLicenseCodes ? 'Ocultar' : 'Mostrar'} Licenças
                    </Button>

                    {/* Seletor de visualização */}
                    <div className="flex border rounded-md">
                      <Button
                        variant={viewMode === 'table' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                        className="rounded-r-none"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'cards' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('cards')}
                        className="rounded-l-none"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>

            {/* Filtros avançados */}
            {showFilters && (
              <CardContent className="border-t">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Função</label>
                    <Select value={filterRole} onValueChange={(value: FilterRole) => setFilterRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="user">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="inactive">Inativos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                    <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Nome</SelectItem>
                        <SelectItem value="created_at">Data de criação</SelectItem>
                        <SelectItem value="last_sign_in_at">Último login</SelectItem>
                        <SelectItem value="budget_count">Orçamentos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Ordem</label>
                    <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Crescente</SelectItem>
                        <SelectItem value="desc">Decrescente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            )}

            {/* Ações em lote */}
            {selectedUsers.length > 0 && (
              <CardContent className="border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedUsers.length} usuário(s) selecionado(s)
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedUsers([])}>
                      Limpar seleção
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Deletar selecionados
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}

            {/* Conteúdo principal */}
            <CardContent>
              {viewMode === 'table' ? (
                <UserTableView 
                  users={filteredAndSortedUsers}
                  selectedUsers={selectedUsers}
                  onSelectUser={handleSelectUser}
                  onSelectAll={handleSelectAll}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onRenew={handleRenew}
                  getRoleBadge={getRoleBadge}
                  getStatusBadge={getStatusBadge}
                  showLicenseCodes={showLicenseCodes}
                  copyLicenseCode={copyLicenseCode}
                  copiedLicense={copiedLicense}
                />
              ) : (
                <UserCardsView 
                  users={filteredAndSortedUsers}
                  selectedUsers={selectedUsers}
                  onSelectUser={handleSelectUser}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onRenew={handleRenew}
                  getRoleBadge={getRoleBadge}
                  getStatusBadge={getStatusBadge}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Análises */}
        <TabsContent value="analytics">
          <UserAnalytics users={filteredAndSortedUsers} />
        </TabsContent>

        {/* Aba de Atividades */}
        <TabsContent value="activity">
          <UserActivityHistory />
        </TabsContent>

        {/* Aba de Configurações */}
        <TabsContent value="settings">
          <UserSettings 
            onExportUsers={exportAllUsers}
            onImportUsers={importUsers}
            onBackupData={backupData}
            onCleanupInactiveUsers={cleanupInactiveUsers}
          />
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <UserEditModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }}
      />

      <UserRenewalDialog
        user={userToRenew}
        isOpen={!!userToRenew}
        onClose={() => setUserToRenew(null)}
        onConfirm={() => {}}
      />

      <UserDeletionDialog
        userToDelete={userToDelete}
        setUserToDelete={setUserToDelete}
        confirmDelete={confirmDelete}
        isPending={deleteUserMutation.isPending}
      />
    </div>
  );
};

// Componente para visualização em tabela
const UserTableView = ({ 
  users, 
  selectedUsers, 
  onSelectUser, 
  onSelectAll, 
  onEdit, 
  onDelete, 
  onRenew,
  getRoleBadge,
  getStatusBadge,
  showLicenseCodes,
  copyLicenseCode,
  copiedLicense
}: {
  users: User[];
  selectedUsers: string[];
  onSelectUser: (userId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onRenew: (user: User) => void;
  getRoleBadge: (role: string) => any;
  getStatusBadge: (user: User) => React.ReactNode;
  showLicenseCodes: boolean;
  copyLicenseCode: (code: string) => void;
  copiedLicense: string | null;
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-12">
          <Checkbox
            checked={selectedUsers.length === users.length && users.length > 0}
            onCheckedChange={onSelectAll}
          />
        </TableHead>
        <TableHead>Nome</TableHead>
        <TableHead>Função</TableHead>
        <TableHead>Status</TableHead>
        {showLicenseCodes && <TableHead>Licença</TableHead>}
        <TableHead>Orçamentos</TableHead>
        <TableHead>Último login</TableHead>
        <TableHead className="text-right">Ações</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {users.map((user) => {
        const roleConfig = getRoleBadge(user.role);
        const RoleIcon = roleConfig.icon;
        
        return (
          <TableRow key={user.id}>
            <TableCell>
              <Checkbox
                checked={selectedUsers.includes(user.id)}
                onCheckedChange={(checked) => onSelectUser(user.id, checked as boolean)}
              />
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={roleConfig.color}>
                <RoleIcon className="h-3 w-3 mr-1" />
                {roleConfig.label}
              </Badge>
            </TableCell>
            <TableCell>{getStatusBadge(user)}</TableCell>
            {showLicenseCodes && (
              <TableCell>
                {user.license_code ? (
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                      {user.license_code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLicenseCode(user.license_code!)}
                      className="h-6 w-6 p-0"
                      title="Copiar código"
                    >
                      {copiedLicense === user.license_code ? (
                        <span className="text-green-500 text-xs">✓</span>
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    {user.license_expires_at && (
                      <div className="text-xs text-muted-foreground">
                        Exp: {format(new Date(user.license_expires_at), 'dd/MM/yy', { locale: ptBR })}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Sem licença</span>
                )}
              </TableCell>
            )}
            <TableCell>{user.budget_count}</TableCell>
            <TableCell>
              {user.last_sign_in_at 
                ? format(new Date(user.last_sign_in_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                : 'Nunca'
              }
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(user)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRenew(user)}>
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Renovar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(user)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
);

// Componente para visualização em cards
const UserCardsView = ({ 
  users, 
  selectedUsers, 
  onSelectUser, 
  onEdit, 
  onDelete, 
  onRenew,
  getRoleBadge,
  getStatusBadge 
}: {
  users: User[];
  selectedUsers: string[];
  onSelectUser: (userId: string, checked: boolean) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onRenew: (user: User) => void;
  getRoleBadge: (role: string) => any;
  getStatusBadge: (user: User) => React.ReactNode;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {users.map((user) => {
      const roleConfig = getRoleBadge(user.role);
      const RoleIcon = roleConfig.icon;
      
      return (
        <Card key={user.id} className="relative">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <Checkbox
                checked={selectedUsers.includes(user.id)}
                onCheckedChange={(checked) => onSelectUser(user.id, checked as boolean)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(user)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRenew(user)}>
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Renovar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(user)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge className={roleConfig.color}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {roleConfig.label}
                </Badge>
                {getStatusBadge(user)}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Orçamentos:</span>
                  <div className="font-medium">{user.budget_count}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Criado em:</span>
                  <div className="font-medium">
                    {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                </div>
              </div>
              
              <div className="text-sm">
                <span className="text-muted-foreground">Último login:</span>
                <div className="font-medium">
                  {user.last_sign_in_at 
                    ? format(new Date(user.last_sign_in_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                    : 'Nunca'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
);

export default EnhancedUserManagement;