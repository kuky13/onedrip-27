
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { 
  Key, 
  Plus, 
  RefreshCw, 
  Calendar, 
  User, 
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LicenseEditModal } from '@/components/license/LicenseEditModal';

interface License {
  id: string;
  code: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  expires_at: string | null;
  created_at: string;
}

export const AdminLicenseManager = () => {
  const [renewalDays, setRenewalDays] = useState('30');
  const [expirationDate, setExpirationDate] = useState('');
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  // Fetch licenses
  const { data: licenses, isLoading } = useQuery({
    queryKey: ['admin-licenses'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_licenses_with_users');
      if (error) throw error;
      return data as License[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Create license mutation
  const createLicenseMutation = useMutation({
    mutationFn: async (expires_at?: string) => {
      const { data, error } = await supabase.rpc('admin_create_license', {
        p_expires_at: expires_at || null
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      showSuccess({
        title: 'Licença Criada!',
        description: `Nova licença criada: ${(data as any).code}`
      });
      queryClient.invalidateQueries({ queryKey: ['admin-licenses'] });
      setExpirationDate('');
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao Criar Licença',
        description: error.message
      });
    }
  });

  // Renew license mutation
  const renewLicenseMutation = useMutation({
    mutationFn: async ({ licenseId, days }: { licenseId: string; days: number }) => {
      const { data, error } = await supabase.rpc('admin_renew_license', {
        license_id: licenseId,
        additional_days: days
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess({
        title: 'Licença Renovada!',
        description: 'A licença foi renovada com sucesso.'
      });
      queryClient.invalidateQueries({ queryKey: ['admin-licenses'] });
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao Renovar Licença',
        description: error.message
      });
    }
  });

  const handleCreateLicense = () => {
    const expires = expirationDate ? new Date(expirationDate).toISOString() : undefined;
    createLicenseMutation.mutate(expires);
  };

  const handleRenewLicense = (licenseId: string) => {
    const days = parseInt(renewalDays);
    if (isNaN(days) || days <= 0) {
      showError({
        title: 'Dias Inválidos',
        description: 'Por favor, insira um número válido de dias.'
      });
      return;
    }
    renewLicenseMutation.mutate({ licenseId, days });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess({
      title: 'Copiado!',
      description: 'Código copiado para a área de transferência.'
    });
  };

  const getStatusBadge = (license: License) => {
    if (!license.expires_at) {
      return <Badge variant="default">Ativa (Sem Expiração)</Badge>;
    }

    const now = new Date();
    const expirationDate = new Date(license.expires_at);
    
    if (expirationDate < now) {
      return <Badge variant="destructive">Expirada</Badge>;
    }
    
    return <Badge variant="default">Ativa</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando licenças...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Gerenciamento de Licenças</h2>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Licença
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Licença</DialogTitle>
                  <DialogDescription>
                    Gere uma nova licença com código único. Opcionalmente, defina uma data de expiração.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="expiration">Data de Expiração (Opcional)</Label>
                    <Input
                      id="expiration"
                      type="datetime-local"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleCreateLicense}
                    disabled={createLicenseMutation.isPending}
                  >
                    {createLicenseMutation.isPending ? 'Criando...' : 'Criar Licença'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold">{licenses?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Ativas</p>
                  <p className="text-lg font-semibold">
                    {licenses?.filter(l => !l.expires_at || new Date(l.expires_at) > new Date()).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Inativas</p>
                  <p className="text-lg font-semibold">
                    {licenses?.filter(l => l.expires_at && new Date(l.expires_at) <= new Date()).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Expirando (7d)</p>
                  <p className="text-lg font-semibold">
                    {licenses?.filter(l => {
                      if (!l.expires_at) return false;
                      const expirationDate = new Date(l.expires_at);
                      const weekFromNow = new Date();
                      weekFromNow.setDate(weekFromNow.getDate() + 7);
                      return expirationDate <= weekFromNow && expirationDate > new Date();
                    }).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Licenses Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses?.map((license) => (
                <TableRow key={license.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {license.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(license.code)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {license.user_name ? (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{license.user_name}</p>
                          <p className="text-sm text-muted-foreground">{license.user_email}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Não atribuída</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(license)}
                  </TableCell>
                  <TableCell>
                    {license.expires_at ? (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(license.expires_at), 'dd/MM/yyyy HH:mm', {
                            locale: ptBR
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sem expiração</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(license.created_at), 'dd/MM/yyyy', {
                      locale: ptBR
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingLicense(license)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Renovar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Renovar Licença</DialogTitle>
                            <DialogDescription>
                              Código: <code className="bg-muted px-2 py-1 rounded">{license.code}</code>
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="renewal-days">Dias para Adicionar</Label>
                              <Input
                                id="renewal-days"
                                type="number"
                                value={renewalDays}
                                onChange={(e) => setRenewalDays(e.target.value)}
                                min="1"
                                max="365"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={() => handleRenewLicense(license.id)}
                              disabled={renewLicenseMutation.isPending}
                            >
                              {renewLicenseMutation.isPending ? 'Renovando...' : 'Renovar'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {!licenses?.length && (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma licença encontrada</h3>
              <p className="text-muted-foreground">Crie sua primeira licença para começar.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* License Edit Modal */}
      <LicenseEditModal
        isOpen={!!editingLicense}
        onClose={() => setEditingLicense(null)}
        license={editingLicense ? {
          id: editingLicense.id,
          user_id: editingLicense.user_id || '',
          user_name: editingLicense.user_name || '',
          user_email: editingLicense.user_email || '',
          license_code: editingLicense.code,
          expires_at: editingLicense.expires_at || '',
          activated_at: '',
          is_active: true,
          notes: ''
        } : null}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-licenses'] });
          setEditingLicense(null);
        }}
      />
    </div>
  );
};
