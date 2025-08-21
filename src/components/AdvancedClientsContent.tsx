import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Phone, Plus, Users, MessageCircle, FileText, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { openWhatsApp } from '@/utils/whatsappUtils';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  created_at: string;
}

interface ClientFormData {
  name: string;
  phone: string;
  email: string;
}

export const AdvancedClientsContent = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    phone: '',
    email: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients-advanced'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          budgets!inner(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(client => ({
        ...client,
        budget_count: client.budgets?.length || 0
      })) as (Client & { budget_count: number })[];
    }
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const { error } = await supabase
        .from('clients')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Cliente criado!',
        description: 'O cliente foi adicionado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['clients-advanced'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating client:', error);
      toast({
        title: 'Erro ao criar cliente',
        description: 'Não foi possível criar o cliente. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (data: ClientFormData & { id: string }) => {
      const { error } = await supabase
        .from('clients')
        .update({ name: data.name, phone: data.phone, email: data.email })
        .eq('id', data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Cliente atualizado!',
        description: 'As informações do cliente foram atualizadas.',
      });
      queryClient.invalidateQueries({ queryKey: ['clients-advanced'] });
      setIsDialogOpen(false);
      setEditingClient(null);
      resetForm();
    },
    onError: (error) => {
      console.error('Error updating client:', error);
      toast({
        title: 'Erro ao atualizar cliente',
        description: 'Não foi possível atualizar o cliente. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Cliente excluído!',
        description: 'O cliente foi removido com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['clients-advanced'] });
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting client:', error);
      toast({
        title: 'Erro ao excluir cliente',
        description: 'Não foi possível excluir o cliente. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e telefone são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (editingClient) {
      updateClientMutation.mutate({ ...formData, id: editingClient.id });
    } else {
      createClientMutation.mutate(formData);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingClient(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (clientToDelete) {
      deleteClientMutation.mutate(clientToDelete.id);
    }
  };

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return phone;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Clientes</h1>
          <p className="text-muted-foreground mt-2">Gerencie sua base de clientes e histórico de orçamentos</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>
      
      <Card className="glass-card shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            Clientes ({clients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Orçamentos</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="group">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{client.name}</p>
                        {client.email && (
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{formatPhone(client.phone)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <FileText className="h-3 w-3 mr-1" />
                        {(client as any).budget_count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(client.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openWhatsApp(`https://wa.me/55${client.phone.replace(/\D/g, '')}`)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setClientToDelete(client);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={deleteClientMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Users}
              title="Nenhum cliente cadastrado"
              description="Comece adicionando seus primeiros clientes para organizar melhor seus orçamentos."
              action={{
                label: "Adicionar Cliente",
                onClick: handleAdd
              }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo do cliente"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="cliente@email.com"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createClientMutation.isPending || updateClientMutation.isPending}
              >
                {(createClientMutation.isPending || updateClientMutation.isPending) 
                  ? 'Salvando...' 
                  : editingClient ? 'Atualizar' : 'Criar'
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{clientToDelete?.name}"? 
              Esta ação não pode ser desfeita e removerá todos os dados relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleteClientMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteClientMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};