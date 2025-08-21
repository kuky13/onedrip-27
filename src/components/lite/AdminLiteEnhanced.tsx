import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Shield, UserPlus, Settings, Search, Calendar, Trash2, Loader2, Gamepad2, Key, BarChart3, Download, Upload, Filter, Grid, List, CheckSquare, MoreHorizontal, Image, Globe, Menu, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserEditModal } from '@/components/UserEditModal';
import { UserDeletionDialog } from '@/components/UserManagement/UserDeletionDialog';
import { UserRenewalDialog } from '@/components/UserManagement/UserRenewalDialog';
import { UserAnalytics } from '@/components/UserManagement/UserAnalytics';
import { UserSettings } from '@/components/UserManagement/UserSettings';
import { BetaFeaturesSettingsLite } from '@/components/lite/BetaFeaturesSettingsLite';
import { VipUserManagement } from '@/components/admin/VipUserManagement';
import { GameSettingsPanel } from '@/components/admin/GameSettingsPanel';
import { AdminLicenseManagerEnhanced } from '@/components/admin/AdminLicenseManagerEnhanced';
import { AdminNotificationManager } from '@/components/admin/AdminNotificationManager';
import { AdminLogs } from '@/components/AdminLogs';
// Debug panels removidos para produção
import { AdminImageManager } from '@/components/admin/AdminImageManager';
import { SiteSettingsContent } from '@/components/SiteSettingsContent';
import { toast } from 'sonner';
interface AdminLiteEnhancedProps {
  userId: string;
  onBack: () => void;
}
const AdminLiteEnhancedComponent = ({
  userId,
  onBack,
  profile
}: AdminLiteEnhancedProps & {
  profile: any;
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'settings' | 'licenses' | 'notifications' | 'vip' | 'game' | 'logs' | 'debug' | 'tests' | 'images' | 'site'>('users');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
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
    users,
    isLoading,
    error,
    deleteUserMutation,
    renewUserLicenseMutation,
    filteredUsers,
    handleEdit,
    handleDelete,
    handleRenew,
    confirmDelete,
    confirmRenewal
  } = useUserManagement();

  // Enhanced filtering and sorting
  const enhancedFilteredUsers = React.useMemo(() => {
    if (!users) return [];
    let filtered = users.filter((user: any) => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || filterStatus === 'active' && user.license_active && new Date(user.expiration_date) > new Date() || filterStatus === 'expired' && (!user.license_active || new Date(user.expiration_date) <= new Date());
      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort users
    filtered.sort((a: any, b: any) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      if (sortBy === 'expiration_date') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
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
    return filtered;
  }, [users, searchTerm, filterRole, filterStatus, sortBy, sortOrder]);
  const handleCreateUser = () => {
    navigate('/signup');
  };

  // Enhanced stats calculation
  const stats = React.useMemo(() => {
    if (!users) return {
      totalUsers: 0,
      activeUsers: 0,
      expiredUsers: 0,
      adminUsers: 0
    };
    return {
      totalUsers: users.length,
      activeUsers: users.filter((user: any) => user.license_active && new Date(user.expiration_date) > new Date()).length,
      expiredUsers: users.filter((user: any) => !user.license_active || new Date(user.expiration_date) <= new Date()).length,
      adminUsers: users.filter((user: any) => user.role === 'admin').length
    };
  }, [users]);
  const getLicenseStatus = (user: any) => {
    if (!user.expiration_date) return 'Sem licença';
    const now = new Date();
    const expiresAt = new Date(user.expiration_date);
    if (expiresAt > now) {
      const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `${daysLeft} dias restantes`;
    } else {
      return 'Expirada';
    }
  };
  const getStatusColor = (user: any) => {
    if (!user.expiration_date) return 'bg-gray-500/20 text-gray-900 dark:text-gray-200';
    const now = new Date();
    const expiresAt = new Date(user.expiration_date);
    if (expiresAt > now && user.license_active) {
      return 'bg-green-500/20 text-green-900 dark:text-green-200';
    } else {
      return 'bg-red-500/20 text-red-900 dark:text-red-200';
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedUsers.length === enhancedFilteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(enhancedFilteredUsers.map((user: any) => user.id));
    }
  };
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  // Export functions
  const exportSelectedUsers = () => {
    const selectedUserData = enhancedFilteredUsers.filter((user: any) => selectedUsers.includes(user.id));
    const csv = generateCSV(selectedUserData);
    downloadCSV(csv, 'usuarios_selecionados.csv');
  };
  const exportAllUsers = () => {
    const csv = generateCSV(enhancedFilteredUsers);
    downloadCSV(csv, 'todos_usuarios.csv');
  };
  const generateCSV = (userData: any[]) => {
    const headers = ['Nome', 'Email', 'Função', 'Status', 'Data de Expiração', 'Último Acesso', 'Orçamentos'];
    const rows = userData.map(user => [user.name || '', user.email || '', user.role === 'admin' ? 'Admin' : 'Usuário', getLicenseStatus(user), user.expiration_date ? formatDate(user.expiration_date) : '', user.last_sign_in_at ? formatDate(user.last_sign_in_at) : '', user.budget_count || 0]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };
  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Functions for UserSettings component
  const handleExportUsers = () => {
    const csv = generateCSV(enhancedFilteredUsers);
    downloadCSV(csv, `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`${enhancedFilteredUsers.length} usuários exportados com sucesso!`);
  };
  const handleImportUsers = (file: File) => {
    // TODO: Implement user import functionality
    console.log('Importing users from file:', file.name);
    toast.success('Funcionalidade de importação será implementada em breve');
  };
  const handleBackupData = () => {
    // TODO: Implement backup functionality
    const backupData = {
      users: enhancedFilteredUsers,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Backup dos dados realizado com sucesso!');
  };
  const handleCleanupInactiveUsers = () => {
    // TODO: Implement cleanup functionality
    const inactiveUsers = enhancedFilteredUsers.filter((user: any) => {
      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return !lastSignIn || lastSignIn < thirtyDaysAgo;
    });
    console.log(`Found ${inactiveUsers.length} inactive users for cleanup`);
    toast.success(`Identificados ${inactiveUsers.length} usuários inativos. Funcionalidade de limpeza será implementada em breve.`);
  };
  if (!debugInfo?.is_admin) {
    return <div className="h-[100dvh] bg-background flex flex-col">
        <div className="flex items-center p-4 border-b">
          <Button variant="ghost" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Painel Admin</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Acesso Negado</h2>
              <p className="text-muted-foreground">
                Você não tem permissões de administrador para acessar esta área.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  if (error) {
    return <div className="h-[100dvh] bg-background flex flex-col">
        <div className="flex items-center p-4 border-b">
          <Button variant="ghost" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Painel Admin</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Erro ao Carregar</h2>
              <p className="text-muted-foreground mb-4">
                Ocorreu um erro ao carregar os dados dos usuários.
              </p>
              <Button onClick={() => window.location.href = '/admin'}>
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  return <div className="h-[100dvh] bg-background flex flex-col">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Painel Admin</h1>
      </div>

      <div className="flex-1 overflow-auto" style={{
      WebkitOverflowScrolling: 'touch'
    }}>
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as any)} className="h-full">
          <div className="sticky top-0 z-10 bg-background border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {activeTab === 'users' && <><Users className="h-5 w-5" />Usuários</>}
                {activeTab === 'analytics' && <><BarChart3 className="h-5 w-5" />Analytics</>}
                {activeTab === 'settings' && <><Settings className="h-5 w-5" />Configurações</>}
                {activeTab === 'licenses' && <><Key className="h-5 w-5" />Licenças</>}
                {activeTab === 'notifications' && <><Bell className="h-5 w-5" />Notificações</>}
                {activeTab === 'vip' && <><Settings className="h-5 w-5" />VIP</>}
                {activeTab === 'game' && <><Gamepad2 className="h-5 w-5" />Jogo</>}
                {activeTab === 'logs' && <><Shield className="h-5 w-5" />Logs</>}
                {activeTab === 'debug' && <><Shield className="h-5 w-5" />Debug</>}
                {activeTab === 'tests' && <><Shield className="h-5 w-5" />Testes</>}
                {activeTab === 'images' && <><Image className="h-5 w-5" />Imagens</>}
                {activeTab === 'site' && <><Globe className="h-5 w-5" />Site</>}
              </h2>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Menu className="h-4 w-4" />
                    Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Seções</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'bg-accent' : ''}>
                    <Users className="h-4 w-4 mr-2" />
                    Usuários
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('analytics')} className={activeTab === 'analytics' ? 'bg-accent' : ''}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'bg-accent' : ''}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('licenses')} className={activeTab === 'licenses' ? 'bg-accent' : ''}>
                    <Key className="h-4 w-4 mr-2" />
                    Licenças
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('notifications')} className={activeTab === 'notifications' ? 'bg-accent' : ''}>
                    <Bell className="h-4 w-4 mr-2" />
                    Notificações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('vip')} className={activeTab === 'vip' ? 'bg-accent' : ''}>
                    <Settings className="h-4 w-4 mr-2" />
                    VIP
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Ferramentas</DropdownMenuLabel>
                  
                  <DropdownMenuItem onClick={() => setActiveTab('game')} className={activeTab === 'game' ? 'bg-accent' : ''}>
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    Jogo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('logs')} className={activeTab === 'logs' ? 'bg-accent' : ''}>
                    <Shield className="h-4 w-4 mr-2" />
                    Logs
                  </DropdownMenuItem>
                  
                  
                  
                  
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <TabsContent value="users" className="p-4 space-y-4">
            {/* Enhanced Stats */}
            

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Buscar usuários..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}>
                  {viewMode === 'table' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                </Button>
                <Button onClick={handleCreateUser} className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Criar
                </Button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Função</label>
                      <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">Usuário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="active">Ativos</SelectItem>
                          <SelectItem value="expired">Expirados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                      <Select value={`${sortBy}-${sortOrder}`} onValueChange={value => {
                    const [field, order] = value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                          <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                          <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                          <SelectItem value="email-desc">Email (Z-A)</SelectItem>
                          <SelectItem value="expiration_date-asc">Expiração (Mais antiga)</SelectItem>
                          <SelectItem value="expiration_date-desc">Expiração (Mais recente)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>}

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {selectedUsers.length} usuário(s) selecionado(s)
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={exportSelectedUsers} className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedUsers([])}>
                        Limpar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>}

            {/* Users List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuários ({enhancedFilteredUsers?.length || 0})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={exportAllUsers} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                    </Button>
                    {enhancedFilteredUsers?.length > 0 && <Button variant="outline" size="sm" onClick={handleSelectAll} className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4" />
                      </Button>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="animate-pulse border rounded-lg p-3">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>)}
                  </div> : enhancedFilteredUsers?.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum usuário encontrado</p>
                  </div> : <div className={viewMode === 'cards' ? "space-y-3 max-h-[400px] overflow-auto" : "overflow-x-auto"}>
                    {viewMode === 'cards' ? enhancedFilteredUsers?.slice(0, 20).map((user: any) => <div key={user.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-start gap-3">
                            <Checkbox checked={selectedUsers.includes(user.id)} onCheckedChange={() => handleSelectUser(user.id)} />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{user.name}</h4>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                
                                <Badge variant="outline" className="text-xs">
                                  {user.role === 'admin' ? 'Admin' : 'Usuário'}
                                </Badge>
                              </div>

                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEdit(user)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRenew(user)}>
                                  Renovar Licença
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(user)} className="text-destructive">
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>) : <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">
                              <Checkbox checked={selectedUsers.length === enhancedFilteredUsers.length} onCheckedChange={handleSelectAll} />
                            </th>
                            <th className="text-left p-2">Nome</th>
                            <th className="text-left p-2">Email</th>
                            <th className="text-left p-2">Função</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Orçamentos</th>
                            <th className="text-left p-2">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enhancedFilteredUsers?.slice(0, 20).map((user: any) => <tr key={user.id} className="border-b">
                              <td className="p-2">
                                <Checkbox checked={selectedUsers.includes(user.id)} onCheckedChange={() => handleSelectUser(user.id)} />
                              </td>
                              <td className="p-2 font-medium">{user.name}</td>
                              <td className="p-2 text-sm text-muted-foreground">{user.email}</td>
                              <td className="p-2">
                                <Badge variant="outline">
                                  {user.role === 'admin' ? 'Admin' : 'Usuário'}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <Badge className={getStatusColor(user)}>
                                  {getLicenseStatus(user)}
                                </Badge>
                              </td>
                              <td className="p-2">{user.budget_count || 0}</td>
                              <td className="p-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleEdit(user)}>
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRenew(user)}>
                                      Renovar Licença
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDelete(user)} className="text-destructive">
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>)}
                        </tbody>
                      </table>}
                  </div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="p-4">
            <UserAnalytics users={users || []} />
          </TabsContent>

          <TabsContent value="settings" className="p-4">
            <UserSettings onExportUsers={handleExportUsers} onImportUsers={handleImportUsers} onBackupData={handleBackupData} onCleanupInactiveUsers={handleCleanupInactiveUsers} />
          </TabsContent>

          <TabsContent value="licenses" className="p-4">
            <AdminLicenseManagerEnhanced />
          </TabsContent>

          <TabsContent value="notifications" className="p-4">
            <AdminNotificationManager />
          </TabsContent>

          <TabsContent value="vip" className="p-4">
            <VipUserManagement userId={userId} profile={profile} />
          </TabsContent>

          <TabsContent value="game" className="p-4">
            <GameSettingsPanel />
          </TabsContent>

          <TabsContent value="logs" className="p-4">
            <AdminLogs />
          </TabsContent>

          <TabsContent value="debug" className="p-4">
            {/* Debug panels removidos para produção */}
          </TabsContent>

          <TabsContent value="tests" className="p-4">
            {/* Debug panels removidos para produção */}
          </TabsContent>

          <TabsContent value="images" className="p-4">
            <AdminImageManager />
          </TabsContent>

          <TabsContent value="site" className="p-4">
            <SiteSettingsContent />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {selectedUser && <UserEditModal user={selectedUser} isOpen={isEditModalOpen} onClose={() => {
      setIsEditModalOpen(false);
      setSelectedUser(null);
    }} onSuccess={() => {
      setIsEditModalOpen(false);
      setSelectedUser(null);
    }} />}

      {userToDelete && <UserDeletionDialog userToDelete={userToDelete} setUserToDelete={setUserToDelete} confirmDelete={confirmDelete} isPending={deleteUserMutation.isPending} />}

      {userToRenew && <UserRenewalDialog user={userToRenew} isOpen={!!userToRenew} onClose={() => setUserToRenew(null)} onConfirm={() => {}} />}
    </div>;
};
export const AdminLiteEnhanced = (props: AdminLiteEnhancedProps) => {
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (user) {
          const {
            data: profileData
          } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();
  }, []);
  return <AdminLiteEnhancedComponent {...props} profile={profile} />;
};