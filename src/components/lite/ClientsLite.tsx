import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, Phone, Plus, Edit, MessageCircle, FileText, Search, Loader2, Trash2, MapPin, Star, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { openWhatsApp } from '@/utils/whatsappUtils';


interface Client {
  id: string;
  name: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  is_favorite?: boolean;
  tags?: string[];
  is_default?: boolean;
  created_at: string;
  budget_count?: number;
}

interface ClientFormData {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  notes: string;
  is_favorite: boolean;
}

interface ClientsLiteProps {
  userId: string;
  onBack: () => void;
}

export const ClientsLite = ({ userId, onBack }: ClientsLiteProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: '',
    is_favorite: false,
  });
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('is_favorite', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      
      const clientsWithCount = (data || []).map(client => ({
        ...client,
        budget_count: 0
      })) as Client[];
      
      setClients(clientsWithCount);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Erro ao carregar clientes',
        description: 'Não foi possível carregar os clientes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createClient = async (data: ClientFormData) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('clients')
        .insert([data]);
      
      if (error) throw error;

      toast({
        title: 'Cliente criado!',
        description: 'O cliente foi adicionado com sucesso.',
      });
      
      await fetchClients();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: 'Erro ao criar cliente',
        description: 'Não foi possível criar o cliente. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateClient = async (data: ClientFormData & { id: string }) => {
    try {
      setIsSaving(true);
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;

      toast({
        title: 'Cliente atualizado!',
        description: 'As informações do cliente foram atualizadas.',
      });
      
      await fetchClients();
      setIsDialogOpen(false);
      setEditingClient(null);
      resetForm();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: 'Erro ao atualizar cliente',
        description: 'Não foi possível atualizar o cliente. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      setIsDeleting(clientId);
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      
      if (error) throw error;

      toast({
        title: 'Cliente excluído!',
        description: 'O cliente foi removido com sucesso.',
      });
      
      await fetchClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({
        title: 'Erro ao excluir cliente',
        description: error.message.includes('Cliente padrão') 
          ? 'O cliente padrão não pode ser excluído.' 
          : 'Não foi possível excluir o cliente. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleFavorite = async (client: Client) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_favorite: !client.is_favorite })
        .eq('id', client.id);
      
      if (error) throw error;
      
      await fetchClients();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o favorito.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchClients();
  }, [userId]);

  const resetForm = () => {
    setFormData({ 
      name: '', 
      phone: '', 
      address: '', 
      city: '', 
      state: '', 
      zip_code: '', 
      notes: '', 
      is_favorite: false 
    });
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
      updateClient({ ...formData, id: editingClient.id });
    } else {
      createClient(formData);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      zip_code: client.zip_code || '',
      notes: client.notes || '',
      is_favorite: client.is_favorite || false,
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingClient(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return phone;
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    client.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const favoriteClients = filteredClients.filter(client => client.is_favorite);
  const regularClients = filteredClients.filter(client => !client.is_favorite);

  return (
    <div className="h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Clientes</h1>
        </div>
        <Button onClick={handleAdd} size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            inputMode="search"
            placeholder="Buscar por nome, telefone, endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  {filteredClients.length} cliente(s) encontrado(s)
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 text-yellow-500" />
                {favoriteClients.length} favorito(s)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Seus Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse border rounded-lg p-3">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum cliente encontrado</p>
                    <p className="text-xs">Tente buscar por nome, telefone ou endereço</p>
                  </>
                ) : (
                  <>
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum cliente cadastrado</p>
                    <p className="text-xs">Adicione seus primeiros clientes</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-auto">
                {[...favoriteClients, ...regularClients].map((client) => (
                  <div key={client.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{client.name}</h4>
                          {client.is_favorite && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                          {client.is_default && <Shield className="h-3 w-3 text-blue-500" />}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-mono">
                            {formatPhone(client.phone)}
                          </p>
                        </div>
                        {client.address && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {client.address}
                              {client.city && `, ${client.city}`}
                              {client.state && ` - ${client.state}`}
                            </p>
                          </div>
                        )}
                        {client.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{client.notes}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {client.budget_count || 0} orçamentos
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(client.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                     <div className="flex flex-wrap gap-1.5 sm:gap-1">
                       <Button 
                         size="sm" 
                         variant="outline"
                         onClick={() => toggleFavorite(client)}
                         className="text-xs h-7 px-2 min-w-0 flex-shrink-0"
                       >
                         <Star className={`h-3 w-3 sm:mr-1 ${client.is_favorite ? 'fill-current text-yellow-500' : ''}`} />
                         <span className="hidden sm:inline ml-1">{client.is_favorite ? 'Remover' : 'Favoritar'}</span>
                       </Button>
                       <Button 
                         size="sm" 
                         variant="outline"
                         onClick={() => handleEdit(client)}
                         className="text-xs h-7 px-2 min-w-0 flex-shrink-0"
                       >
                         <Edit className="h-3 w-3 sm:mr-1" />
                         <span className="hidden sm:inline ml-1">Editar</span>
                       </Button>
                       <Button 
                         size="sm" 
                         variant="outline"
                         onClick={() => openWhatsApp(`https://wa.me/55${client.phone.replace(/\D/g, '')}`)}
                         className="text-xs h-7 px-2 min-w-0 flex-shrink-0"
                       >
                         <MessageCircle className="h-3 w-3 sm:mr-1" />
                         <span className="hidden sm:inline ml-1">WhatsApp</span>
                       </Button>
                       {!client.is_default && (
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button 
                               size="sm" 
                               variant="outline"
                               className="text-xs h-7 px-2 min-w-0 flex-shrink-0 text-red-600 hover:text-red-700"
                               disabled={isDeleting === client.id}
                             >
                               {isDeleting === client.id ? (
                                 <Loader2 className="h-3 w-3 animate-spin" />
                               ) : (
                                 <Trash2 className="h-3 w-3 sm:mr-1" />
                               )}
                               <span className="hidden sm:inline ml-1">Excluir</span>
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Tem certeza que deseja excluir o cliente "{client.name}"? 
                                 Esta ação não pode ser desfeita.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                               <AlertDialogAction 
                                 onClick={() => deleteClient(client.id)}
                                 className="bg-red-600 hover:bg-red-700"
                               >
                                 Excluir
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                       )}
                     </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo do cliente"
                  required
                />
              </div>
              <div className="col-span-2">
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
              <div className="col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="zip_code">CEP</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  placeholder="00000-000"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações sobre o cliente..."
                  rows={3}
                />
              </div>
              <div className="col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_favorite"
                    checked={formData.is_favorite}
                    onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_favorite" className="text-sm">Marcar como favorito</Label>
                </div>
              </div>
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
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingClient ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};