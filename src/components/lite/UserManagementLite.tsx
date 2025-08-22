import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, RotateCcw, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Switch } from '@/components/ui/switch';

interface UserManagementLiteProps {
  onBack: () => void;
}

interface UserManagementUser {
  id: string;
  name: string;
  role: string;
  budget_limit: number | null;
  email?: string;
}

export const UserManagementLite = ({ onBack }: UserManagementLiteProps) => {
  const { user, hasRole } = useAuth();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<UserManagementUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagementUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user',
    budget_limit: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    if (!hasRole('admin')) {
      showError({
        title: 'Acesso negado',
        description: 'Você não tem permissão para gerenciar usuários.'
      });
      return;
    }

    try {
      setLoading(true);

      // Buscar perfis de usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('name');

      if (profilesError) throw profilesError;

      // Buscar emails dos usuários autenticados
      let authUsers: any = null;
      try {
        const { data, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError) {
          authUsers = data;
        }
      } catch (error) {
        console.warn('Could not fetch auth users:', error);
      }

      // Combinar dados
      const usersWithEmail = profiles?.map(profile => {
        const authUser = authUsers?.users?.find((au: any) => au.id === profile.id);
        return {
          ...profile,
          email: authUser?.email || 'N/A'
        };
      }) || [];

      setUsers(usersWithEmail);
    } catch (error: any) {
      console.error('Error loading users:', error);
      showError({
        title: 'Erro ao carregar usuários',
        description: error.message || 'Não foi possível carregar a lista de usuários.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.name || !newUser.email) {
      showError({
        title: 'Campos obrigatórios',
        description: 'Nome e email são obrigatórios.'
      });
      return;
    }

    try {
      // Criar usuário através do auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: 'TempPassword123!', // Usuário deve redefinir
        email_confirm: true,
        user_metadata: {
          name: newUser.name
        }
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authUser.user.id,
          name: newUser.name,
          role: newUser.role,
          budget_limit: newUser.budget_limit ? parseInt(newUser.budget_limit) : null
        });

      if (profileError) throw profileError;

      showSuccess({
        title: 'Usuário criado!',
        description: 'O usuário foi criado com sucesso. Uma senha temporária foi definida.'
      });

      setNewUser({
        name: '',
        email: '',
        role: 'user',
        budget_limit: ''
      });
      setShowCreateForm(false);
      loadUsers();

    } catch (error: any) {
      console.error('Error creating user:', error);
      showError({
        title: 'Erro ao criar usuário',
        description: error.message || 'Não foi possível criar o usuário.'
      });
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<UserManagementUser>) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      showSuccess({
        title: 'Usuário atualizado',
        description: 'As alterações foram salvas com sucesso.'
      });

      loadUsers();
      setEditingUser(null);

    } catch (error: any) {
      console.error('Error updating user:', error);
      showError({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível atualizar o usuário.'
      });
    }
  };

  const handleRenewLicense = async (userId: string) => {
    // License renewal now handled by license system
    showError({
      title: 'Funcionalidade Desabilitada',
      description: 'A renovação foi removida. Use o sistema de licenças.'
    });
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-900 dark:text-red-200';
      case 'manager':
        return 'bg-blue-500/20 text-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-500/20 text-gray-900 dark:text-gray-200';
    }
  };

  if (!hasRole('admin')) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col">
        <div className="flex items-center p-4 border-b">
          <Button variant="ghost" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Acesso Negado</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 p-4">
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta funcionalidade.
            </p>
            <Button onClick={onBack}>Voltar</Button>
          </div>
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col">
        <div className="flex items-center p-4 border-b">
          <Button variant="ghost" onClick={() => setShowCreateForm(false)} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Criar Usuário</h1>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <form onSubmit={handleCreateUser} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Usuário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="Nome completo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="role">Função</Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value) => setNewUser({...newUser, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="budget_limit">Limite de Orçamentos</Label>
                  <Input
                    id="budget_limit"
                    type="number"
                    value={newUser.budget_limit}
                    onChange={(e) => setNewUser({...newUser, budget_limit: e.target.value})}
                    placeholder="Deixe vazio para ilimitado"
                  />
                </div>

                {/* Expiration date removed - now handled by license system */}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Usuário
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Gerenciar Usuários</h1>
        </div>
        <Button onClick={() => setShowCreateForm(true)} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 border-b">
        <Input
          type="search"
          inputMode="search"
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
            <Button onClick={() => setShowCreateForm(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Usuário
            </Button>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                    <Badge variant="default">
                      Usuário
                    </Badge>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mb-3">
                  {/* Expiration info removed - now handled by license system */}
                  {user.budget_limit && (
                    <p>Limite: {user.budget_limit} orçamentos</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingUser(user)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRenewLicense(user.id)}
                    className="flex-1"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Renovar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Editar Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                />
              </div>

              <div>
                <Label>Função</Label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value) => setEditingUser({...editingUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingUser(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => handleUpdateUser(editingUser.id, editingUser)}
                  className="flex-1"
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};