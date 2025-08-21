
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export const useSecureClients = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ['secure-clients', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          phone,
          address,
          city,
          state,
          zip_code,
          notes,
          is_favorite,
          tags,
          is_default,
          created_at,
          updated_at
        `)
        .order('is_favorite', { ascending: false })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Função específica para buscar o cliente padrão
  const getDefaultClient = () => {
    const clients = clientsQuery.data || [];
    return clients.find(client => client.is_default === true);
  };

  const createClient = useMutation({
    mutationFn: async (clientData: { 
      name: string; 
      phone: string; 
      address?: string;
      city?: string;
      state?: string;
      zip_code?: string;
      notes?: string;
      is_favorite?: boolean;
      tags?: string[];
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...clientData, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-clients'] });
      showSuccess({
        title: 'Cliente criado',
        description: 'Cliente criado com sucesso!'
      });
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao criar cliente',
        description: error.message
      });
    }
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string; 
      name?: string; 
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zip_code?: string;
      notes?: string;
      is_favorite?: boolean;
      tags?: string[];
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-clients'] });
      showSuccess({
        title: 'Cliente atualizado',
        description: 'Cliente atualizado com sucesso!'
      });
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao atualizar cliente',
        description: error.message
      });
    }
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-clients'] });
      showSuccess({
        title: 'Cliente excluído',
        description: 'Cliente excluído com sucesso!'
      });
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao excluir cliente',
        description: error.message
      });
    }
  });

  return {
    clients: clientsQuery.data || [],
    isLoading: clientsQuery.isLoading,
    error: clientsQuery.error,
    createClient: createClient.mutate,
    updateClient: updateClient.mutate,
    deleteClient: deleteClient.mutate,
    isCreating: createClient.isPending,
    isUpdating: updateClient.isPending,
    isDeleting: deleteClient.isPending,
    getDefaultClient // Nova função para obter cliente padrão
  };
};
