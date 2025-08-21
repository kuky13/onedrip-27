import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { Plus, Search, Filter, User, Calendar, Key, Edit, RefreshCw, Unlink, AlertCircle, CheckCircle, BarChart3, Copy, Power, PowerOff } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LicenseReportsPanel } from './LicenseReportsPanel';
interface License {
  id: string;
  code: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  expires_at: string | null;
  created_at: string;
  is_active: boolean;
}
export const AdminLicenseManagerEnhanced = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [renewDays, setRenewDays] = useState(30);
  const {
    showSuccess,
    showError
  } = useToast();
  const queryClient = useQueryClient();
  const {
    data: licenses,
    isLoading,
    error: queryError
  } = useQuery({
    queryKey: ['admin-licenses'],
    queryFn: async (): Promise<License[]> => {
      console.log('Fetching licenses...');
      const {
        data,
        error
      } = await supabase.rpc('admin_get_licenses_with_users');
      if (error) {
        console.error('Error fetching licenses:', error);
        throw error;
      }
      console.log('Raw licenses data:', data);

      // Transformar os dados para garantir compatibilidade com a interface
      const transformedData = (data || []).map((item: any) => ({
        id: item.id || '',
        code: item.code || '',
        user_id: item.user_id || null,
        user_email: item.user_email || null,
        user_name: item.user_name || null,
        expires_at: item.expires_at || null,
        created_at: item.created_at || new Date().toISOString(),
        is_active: item.is_active !== undefined ? item.is_active : true
      }));
      console.log('Transformed licenses data:', transformedData);
      return transformedData;
    },
    retry: 3,
    retryDelay: 1000
  });
  const createLicenseMutation = useMutation({
    mutationFn: async () => {
      const {
        data,
        error
      } = await supabase.rpc('admin_create_license');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-licenses']
      });
      showSuccess({
        title: 'Licença Criada!',
        description: 'Nova licença foi gerada com sucesso.'
      });
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao criar licença',
        description: error.message
      });
    }
  });
  const renewLicenseMutation = useMutation({
    mutationFn: async ({
      licenseId,
      days
    }: {
      licenseId: string;
      days: number;
    }) => {
      const {
        data,
        error
      } = await supabase.rpc('admin_renew_license', {
        license_id: licenseId,
        additional_days: days
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-licenses']
      });
      showSuccess({
        title: 'Licença Renovada!',
        description: `Licença foi estendida por ${renewDays} dias.`
      });
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao renovar licença',
        description: error.message
      });
    }
  });
  const unlinkLicenseMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      const {
        error
      } = await supabase.from('licenses').update({
        user_id: null
      }).eq('id', licenseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-licenses']
      });
      showSuccess({
        title: 'Licença Desvinculada!',
        description: 'Licença foi desvinculada do usuário.'
      });
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao desvincular',
        description: error.message
      });
    }
  });
  const toggleLicenseStatusMutation = useMutation({
    mutationFn: async (license: License) => {
      const newStatus = !license.is_active;
      const { error } = await supabase
        .from('licenses')
        .update({ is_active: newStatus })
        .eq('id', license.id);
      
      if (error) throw error;
      return { id: license.id, is_active: newStatus };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['admin-licenses']
      });
      showSuccess({
        title: 'Status Alterado!',
        description: `Licença ${data.is_active ? 'ativada' : 'desativada'} com sucesso.`
      });
    },
    onError: (error: any) => {
      showError({
        title: 'Erro ao alterar status',
        description: error.message
      });
    }
  });
  const filteredLicenses = licenses?.filter(license => {
    const matchesSearch = license.code.toLowerCase().includes(searchTerm.toLowerCase()) || license.user_name && license.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || license.user_email && license.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const now = new Date();
    const isExpired = license.expires_at && new Date(license.expires_at) < now;
    const isTemporallyActive = !license.expires_at || new Date(license.expires_at) > new Date();
    
    // Combinar is_active e status temporal
    const isFullyActive = license.is_active && isTemporallyActive && !isExpired;
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && isFullyActive) || 
                         (statusFilter === 'inactive' && !license.is_active) || 
                         (statusFilter === 'expired' && isExpired);
    return matchesSearch && matchesStatus;
  });
  const getStatusBadge = (license: License) => {
    const now = new Date();
    const isExpired = license.expires_at && new Date(license.expires_at) < now;
    
    if (!license.is_active) {
      return <Badge variant="secondary" className="flex items-center space-x-1">
        <PowerOff className="h-3 w-3" />
        <span>Inativa</span>
      </Badge>;
    }
    
    if (isExpired) {
      return <Badge variant="destructive" className="flex items-center space-x-1">
        <AlertCircle className="h-3 w-3" />
        <span>Expirada</span>
      </Badge>;
    }
    
    return <Badge variant="default" className="flex items-center space-x-1">
      <CheckCircle className="h-3 w-3" />
      <span>Ativa</span>
    </Badge>;
  };
  return <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Licenças</h2>
          <p className="text-muted-foreground">Gerencie licenças, usuários e visualize relatórios</p>
        </div>
        
        
      </div>

      {/* Tabs */}
      <Tabs defaultValue="licenses" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="licenses">
            <Key className="mr-2 h-4 w-4" />
            Licenças
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="mr-2 h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="licenses" className="space-y-4">

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros e Busca</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Código, usuário ou email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                  <SelectItem value="expired">Expiradas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dias para Renovação</label>
              <Input type="number" value={renewDays} onChange={e => setRenewDays(Number(e.target.value))} min={1} max={365} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licenses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Licenças ({filteredLicenses?.length || 0})</CardTitle>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({
                queryKey: ['admin-licenses']
              })} className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Atualizar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando licenças...</p>
            </div> : queryError ? <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-medium">Erro ao carregar licenças</p>
              <p className="text-sm text-muted-foreground mt-1">{typeof queryError === 'string' ? queryError : queryError?.message || 'Erro desconhecido'}</p>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({
                queryKey: ['admin-licenses']
              })} className="mt-4">
                Tentar Novamente
              </Button>
            </div> : !licenses?.length ? <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma licença cadastrada no sistema</p>
            </div> : !filteredLicenses?.length ? <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma licença encontrada com os filtros aplicados</p>
            </div> : <div className="space-y-4">
              {filteredLicenses.map(license => {
                const hasUser = license.user_id && license.user_name;
                return <div key={license.id} className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                      <div className="space-y-1">
                         <div className="flex items-center space-x-2">
                           <Key className="h-4 w-4 text-muted-foreground" />
                           <span className="font-mono text-sm font-medium">{license.code}</span>
                           <Button size="sm" variant="ghost" onClick={() => {
                          navigator.clipboard.writeText(license.code);
                          showSuccess({
                            title: 'Copiado!',
                            description: 'Código da licença copiado para a área de transferência.'
                          });
                        }} className="h-6 w-6 p-0">
                             <Copy className="h-3 w-3" />
                           </Button>
                           {getStatusBadge(license)}
                        </div>
                        
                        {hasUser && <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{license.user_name} ({license.user_email})</span>
                          </div>}
                        
                        {license.expires_at && <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Expira em: {format(new Date(license.expires_at), 'dd/MM/yyyy')}</span>
                          </div>}
                      </div>

                       <div className="flex items-center space-x-2">
                         <Button 
                           size="sm" 
                           variant={license.is_active ? "outline" : "default"} 
                           onClick={() => toggleLicenseStatusMutation.mutate(license)} 
                           disabled={toggleLicenseStatusMutation.isPending}
                           title={license.is_active ? "Desativar licença" : "Ativar licença"}
                         >
                           {license.is_active ? <PowerOff className="h-3 w-3 mr-1" /> : <Power className="h-3 w-3 mr-1" />}
                           {license.is_active ? "Desativar" : "Ativar"}
                         </Button>

                         <Button size="sm" variant="outline" onClick={() => renewLicenseMutation.mutate({
                         licenseId: license.id,
                         days: renewDays
                       })} disabled={renewLicenseMutation.isPending}>
                           <RefreshCw className="h-3 w-3 mr-1" />
                           Renovar
                         </Button>

                         {license.user_id && <Button size="sm" variant="outline" onClick={() => unlinkLicenseMutation.mutate(license.id)} disabled={unlinkLicenseMutation.isPending}>
                             <Unlink className="h-3 w-3 mr-1" />
                             Desvincular
                           </Button>}
                       </div>
                    </div>
                  </div>;
              })}
            </div>}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="reports">
          <LicenseReportsPanel />
        </TabsContent>
      </Tabs>
    </div>;
};