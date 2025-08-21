import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { User, Save } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
export const ProfileSettings = () => {
  const {
    user,
    profile
  } = useAuth();
  const {
    showSuccess,
    showError
  } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: user?.email || ''
  });
  const updateProfileMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      const {
        data,
        error
      } = await supabase.from('user_profiles').update({
        name
      }).eq('id', user.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['user-profile', user?.id]
      });
      showSuccess({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.'
      });
    },
    onError: error => {
      console.error('Error updating profile:', error);
      showError({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar suas informações.'
      });
    }
  });
  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError({
        title: 'Campo obrigatório',
        description: 'O nome é obrigatório.'
      });
      return;
    }
    updateProfileMutation.mutate(formData.name);
  };
  return <Card className="glass-card animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <User className="h-5 w-5 mr-2 text-primary" />
          Perfil Pessoal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" value={formData.name} onChange={e => setFormData({
          ...formData,
          name: e.target.value
        })} placeholder="Seu nome completo" />
        </div>
        
        <Button onClick={handleSave} disabled={updateProfileMutation.isPending} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </CardContent>
    </Card>;
};