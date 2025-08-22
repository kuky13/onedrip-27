import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, Search, Users, UserCheck, UserX, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  service_orders_vip_enabled: boolean;
  created_at: string;
  last_sign_in_at?: string;
}

interface VipUserManagementProps {
  userId: string;
  profile: any;
}

export const VipUserManagement = ({ userId, profile }: VipUserManagementProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterVipStatus, setFilterVipStatus] = useState<string>('all');
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Usar a função RPC admin_get_all_users que tem as permissões corretas
      const { data, error } = await supabase.rpc('admin_get_all_users');

      if (error) {
        console.error('Error loading users:', error);
        let errorMessage = "Não foi possível carregar a lista de usuários.";
        
        if (error.message?.includes('permission denied')) {
          errorMessage = "Acesso negado. Verifique se você tem permissões de administrador.";
        } else if (error.message?.includes('function')) {
          errorMessage = "Função administrativa não encontrada. Contate o suporte técnico.";
        }
        
        toast({
          title: "Erro ao carregar usuários",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      // Mapear os dados da RPC para o formato esperado pelo componente
      const mappedUsers = (data || []).map((user: any) => ({
        id: user.id,
        name: user.name,
        username: user.email?.split('@')[0] || user.name.toLowerCase().replace(/\s+/g, ''),
        role: user.role,
        service_orders_vip_enabled: false, // Inicializar como false, será carregado separadamente
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      }));
      
      // Carregar status VIP separadamente da tabela user_profiles
      if (mappedUsers.length > 0) {
        const userIds = mappedUsers.map(u => u.id);
        const { data: vipData } = await supabase
          .from('user_profiles')
          .select('id, service_orders_vip_enabled')
          .in('id', userIds);
          
        if (vipData) {
          mappedUsers.forEach(user => {
            const vipInfo = vipData.find(v => v.id === user.id);
            if (vipInfo) {
              user.service_orders_vip_enabled = vipInfo.service_orders_vip_enabled || false;
            }
          });
        }
      }
      
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado ao carregar usuários. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVipStatus = async (user: User) => {
    if (updatingUsers.has(user.id)) return;

    try {
      setUpdatingUsers(prev => new Set(prev).add(user.id));
      
      const newVipStatus = !user.service_orders_vip_enabled;
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ service_orders_vip_enabled: newVipStatus })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating VIP status:', error);
        toast({
          title: "Erro ao atualizar status VIP",
          description: "Não foi possível atualizar o status VIP do usuário.",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === user.id 
          ? { ...u, service_orders_vip_enabled: newVipStatus }
          : u
      ));

      toast({
        title: "Status VIP atualizado",
        description: `${user.name} ${newVipStatus ? 'agora tem' : 'não tem mais'} acesso VIP às ordens de serviço.`
      });
    } catch (error) {
      console.error('Error updating VIP status:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  };

  const enableVipForAll = async () => {
    if (!confirm('Tem certeza que deseja ativar o acesso VIP para todos os usuários?')) {
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ service_orders_vip_enabled: true })
        .neq('role', 'admin'); // Não alterar admins

      if (error) {
        console.error('Error enabling VIP for all:', error);
        toast({
          title: "Erro ao ativar VIP para todos",
          description: "Não foi possível ativar o acesso VIP para todos os usuários.",
          variant: "destructive"
        });
        return;
      }

      await loadUsers();
      
      toast({
        title: "VIP ativado para todos",
        description: "Todos os usuários agora têm acesso VIP às ordens de serviço."
      });
    } catch (error) {
      console.error('Error enabling VIP for all:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disableVipForAll = async () => {
    if (!confirm('Tem certeza que deseja desativar o acesso VIP para todos os usuários?')) {
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ service_orders_vip_enabled: false })
        .neq('role', 'admin'); // Não alterar admins

      if (error) {
        console.error('Error disabling VIP for all:', error);
        toast({
          title: "Erro ao desativar VIP para todos",
          description: "Não foi possível desativar o acesso VIP para todos os usuários.",
          variant: "destructive"
        });
        return;
      }

      await loadUsers();
      
      toast({
        title: "VIP desativado para todos",
        description: "O acesso VIP às ordens de serviço foi removido de todos os usuários."
      });
    } catch (error) {
      console.error('Error disabling VIP for all:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesVipStatus = filterVipStatus === 'all' || 
                            (filterVipStatus === 'vip' && user.service_orders_vip_enabled) ||
                            (filterVipStatus === 'non-vip' && !user.service_orders_vip_enabled);
    
    return matchesSearch && matchesRole && matchesVipStatus;
  });

  const vipUsersCount = users.filter(u => u.service_orders_vip_enabled).length;
  const totalUsersCount = users.length;

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Acesso negado. Apenas administradores podem gerenciar status VIP.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Gerenciamento de Usuários VIP
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Gerencie o acesso VIP às ordens de serviço para usuários específicos
        </p>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-500" />
            <span>{vipUsersCount} usuários VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span>{totalUsersCount} usuários total</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ações em massa */}
        <div className="flex gap-2 flex-wrap items-center">
          <Button 
            onClick={enableVipForAll}
            disabled={loading}
            variant="outline"
            size="sm"
            className="transition-all duration-200 hover:scale-105"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Ativar VIP para Todos
          </Button>
          <Button 
            onClick={disableVipForAll}
            disabled={loading}
            variant="outline"
            size="sm"
            className="transition-all duration-200 hover:scale-105"
          >
            <UserX className="h-4 w-4 mr-2" />
            Desativar VIP para Todos
          </Button>
          <Button 
            onClick={loadUsers}
            disabled={loading}
            variant="outline"
            size="sm"
            className="transition-all duration-200 hover:scale-105"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Atualizar Lista
          </Button>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando usuários...</span>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cargos</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterVipStatus} onValueChange={setFilterVipStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status VIP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="vip">Apenas VIP</SelectItem>
              <SelectItem value="non-vip">Apenas não-VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de usuários */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-lg font-medium">Carregando usuários...</p>
              <p className="text-sm text-muted-foreground">Aguarde enquanto buscamos os dados</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-lg font-medium">Nenhum usuário encontrado</p>
                  <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou recarregar a lista</p>
                </div>
                <Button onClick={loadUsers} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar
                </Button>
              </div>
            ) : (
              filteredUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 hover:shadow-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name}</span>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                        {user.service_orders_vip_enabled && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600 animate-pulse">
                            <Crown className="h-3 w-3 mr-1" />
                            VIP
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">@{user.username}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor={`vip-${user.id}`} className="text-sm font-medium">
                      Acesso VIP
                    </Label>
                    <div className="relative">
                      <Switch
                        id={`vip-${user.id}`}
                        checked={user.service_orders_vip_enabled}
                        onCheckedChange={() => toggleVipStatus(user)}
                        disabled={updatingUsers.has(user.id)}
                        className="transition-all duration-200"
                      />
                      {updatingUsers.has(user.id) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};