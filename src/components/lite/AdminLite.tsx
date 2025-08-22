import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Shield, UserPlus, Settings, Search, Calendar, Trash2, Loader2, Gamepad2, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserEditModal } from '@/components/UserEditModal';
import { UserDeletionDialog } from '@/components/UserManagement/UserDeletionDialog';
import { UserRenewalDialog } from '@/components/UserManagement/UserRenewalDialog';
import { BetaFeaturesSettingsLite } from '@/components/lite/BetaFeaturesSettingsLite';
import { VipUserManagement } from '@/components/admin/VipUserManagement';
import { GameSettingsPanel } from '@/components/admin/GameSettingsPanel';
import { AdminLicenseManagerEnhanced } from '@/components/admin/AdminLicenseManagerEnhanced';
interface AdminLiteProps {
  userId: string;
  onBack: () => void;
}
const AdminLiteComponent = ({
  userId,
  onBack,
  profile
}: AdminLiteProps & {
  profile: any;
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'licenses' | 'vip' | 'game'>('users');
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
  const handleCreateUser = () => {
    navigate('/signup');
  };

  // Stats calculation based on users data
  const stats = {
    totalUsers: users?.length || 0,
    activeUsers: users?.filter((user: any) => user.license_active && new Date(user.expiration_date) > new Date()).length || 0,
    expiredUsers: users?.filter((user: any) => !user.license_active || new Date(user.expiration_date) <= new Date()).length || 0
  };
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

      <div className="flex-1 overflow-auto p-4 space-y-4" style={{
      WebkitOverflowScrolling: 'touch'
    }}>
        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto" style={{
        WebkitOverflowScrolling: 'touch'
      }}>
          <Button variant={activeTab === 'users' ? 'default' : 'outline'} onClick={() => setActiveTab('users')} className="flex items-center gap-2 whitespace-nowrap" style={{
          WebkitTapHighlightColor: 'transparent'
        }}>
            <Users className="h-4 w-4" />
            Usuários
          </Button>
          <Button variant={activeTab === 'licenses' ? 'default' : 'outline'} onClick={() => setActiveTab('licenses')} className="flex items-center gap-2 whitespace-nowrap" style={{
          WebkitTapHighlightColor: 'transparent'
        }}>
            <Key className="h-4 w-4" />
            Licenças
          </Button>
          <Button variant={activeTab === 'vip' ? 'default' : 'outline'} onClick={() => setActiveTab('vip')} className="flex items-center gap-2 whitespace-nowrap" style={{
          WebkitTapHighlightColor: 'transparent'
        }}>
            <Settings className="h-4 w-4" />
            VIP
          </Button>
          <Button variant={activeTab === 'game' ? 'default' : 'outline'} onClick={() => setActiveTab('game')} className="flex items-center gap-2 whitespace-nowrap" style={{
          WebkitTapHighlightColor: 'transparent'
        }}>
            <Gamepad2 className="h-4 w-4" />
           Jogo
          </Button>
        </div>

        {activeTab === 'licenses' ? <AdminLicenseManagerEnhanced /> : activeTab === 'vip' ? <VipUserManagement userId={userId} profile={profile} /> : activeTab === 'game' ? <GameSettingsPanel /> : <>
            {/* Create User Button */}
            <div className="flex justify-end">
              <Button onClick={handleCreateUser} className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Criar Usuário
              </Button>
            </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3 text-center">
              <Users className="h-6 w-6 text-primary mx-auto mb-1" />
              <div className="text-lg font-bold">
                {isLoading ? '--' : stats.totalUsers}
              </div>
              <div className="text-xs text-muted-foreground">
                Total
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <Shield className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <div className="text-lg font-bold">
                {isLoading ? '--' : stats.activeUsers}
              </div>
              <div className="text-xs text-muted-foreground">
                Ativos
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <UserPlus className="h-6 w-6 text-red-500 mx-auto mb-1" />
              <div className="text-lg font-bold">
                {isLoading ? '--' : stats.expiredUsers}
              </div>
              <div className="text-xs text-muted-foreground">
                Expirados
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar usuários..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários ({filteredUsers?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="animate-pulse border rounded-lg p-3">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>)}
              </div> : filteredUsers?.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div> : <div className="space-y-3 max-h-[400px] overflow-auto">
                {filteredUsers?.slice(0, 20).map(user => <div key={user.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{user.name}</h4>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(user)}>
                            {getLicenseStatus(user)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {user.role === 'admin' ? 'Admin' : 'Usuário'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {user.budget_count || 0} orçamentos
                        </p>
                        {user.last_sign_in_at && <p className="text-xs text-muted-foreground">
                            Último acesso: {formatDate(user.last_sign_in_at)}
                          </p>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(user)} className="text-xs">
                        Editar
                      </Button>
                      
                      {/* Renewal button removed - now handled by license system */}
                      
                      
                      
                      
                    </div>
                  </div>)}
              </div>}
          </CardContent>
        </Card>
          </>}
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
export const AdminLite = (props: AdminLiteProps) => {
  // Get profile data using the same hook pattern as other components
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
  return <AdminLiteComponent {...props} profile={profile} />;
};