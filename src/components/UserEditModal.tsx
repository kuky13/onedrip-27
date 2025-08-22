
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';
import { User } from '@/types/user';
import { AdminUserActions } from '@/components/admin/AdminUserActions';

interface UserEditModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserEditModal = ({ user, isOpen, onClose, onSuccess }: UserEditModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    role: 'user',
    license_active: true
  });
  
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        role: user.role,
        license_active: user.license_active
      });
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) return;
      
      const { error } = await supabase.rpc('admin_update_user', {
        p_user_id: user.id,
        p_name: data.name,
        p_role: data.role
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess({
        title: 'Usuário atualizado',
        description: 'As informações do usuário foram atualizadas com sucesso.',
      });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao atualizar usuário',
        description: error.message || 'Ocorreu um erro ao atualizar o usuário.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate(formData);
  };

  const handleSuccess = () => {
    onSuccess();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Função</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User expiration removed - now handled by license system */}

              <div className="flex items-center space-x-2">
                <Switch
                  id="license_active"
                  checked={formData.license_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, license_active: checked })}
                />
                <Label htmlFor="license_active">Licença ativa</Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>

          {/* Ações administrativas */}
          <AdminUserActions
            userId={user.id}
            userEmail={user.email}
            userName={user.name}
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
