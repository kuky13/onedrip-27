import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { BarChart3, TrendingUp, TrendingDown, Users, Key, Clock, AlertTriangle, CheckCircle, Plus, RefreshCw, Shuffle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
interface LicenseStats {
  total_licenses: number;
  active_licenses: number;
  used_licenses: number;
  unused_licenses: number;
  expired_active: number;
  expiring_soon: number;
  created_today: number;
  activated_today: number;
  timestamp: string;
}
export const LicenseReportsPanel: React.FC = () => {
  const [customCode, setCustomCode] = useState('');
  const [customDays, setCustomDays] = useState(30);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [stats, setStats] = useState<LicenseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingLicenses, setIsCreatingLicenses] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState(10);
  const [bulkDays, setBulkDays] = useState(365);
  const {
    showSuccess,
    showError
  } = useToast();
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 13; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomCode(result);
  };
  const fetchLicenseStats = async () => {
    try {
      const {
        data,
        error
      } = await supabase.rpc('admin_get_license_stats');
      if (error) throw error;
      setStats(data as unknown as LicenseStats);
    } catch (error) {
      console.error('Error fetching license stats:', error);
      showError({
        title: 'Erro ao Carregar',
        description: 'Não foi possível carregar as estatísticas de licenças.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  const createBulkLicenses = async () => {
    if (bulkQuantity < 1 || bulkQuantity > 100) {
      showError({
        title: 'Quantidade Inválida',
        description: 'A quantidade deve estar entre 1 e 100 licenças.'
      });
      return;
    }
    if (bulkDays < 1 || bulkDays > 3650) {
      showError({
        title: 'Dias Inválidos',
        description: 'O período deve estar entre 1 e 3650 dias.'
      });
      return;
    }
    setIsCreatingLicenses(true);
    try {
      const {
        data,
        error
      } = await supabase.rpc('admin_create_bulk_licenses', {
        p_quantity: bulkQuantity,
        p_expires_in_days: bulkDays
      });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        showSuccess({
          title: 'Licenças Criadas!',
          description: `${result.quantity} licenças criadas com sucesso.`
        });
        fetchLicenseStats(); // Atualizar estatísticas
      }
    } catch (error) {
      console.error('Error creating bulk licenses:', error);
      showError({
        title: 'Erro ao Criar',
        description: 'Não foi possível criar as licenças em lote.'
      });
    } finally {
      setIsCreatingLicenses(false);
    }
  };
  const createCustomLicense = async () => {
    if (!customCode.trim()) {
      showError({
        title: 'Código Inválido',
        description: 'Por favor, insira um código para a licença.'
      });
      return;
    }
    if (customDays < 1 || customDays > 3650) {
      showError({
        title: 'Dias Inválidos',
        description: 'O período deve estar entre 1 e 3650 dias.'
      });
      return;
    }
    setIsCreatingCustom(true);
    try {
      // Check if code exists
      const {
        data: existing,
        error: checkError
      } = await supabase.from('licenses').select('id').eq('code', customCode).single();
      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existing) {
        showError({
          title: 'Código Duplicado',
          description: 'Já existe uma licença com este código.'
        });
        return;
      }
      // Create license
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + customDays);
      const {
        error: insertError
      } = await supabase.from('licenses').insert([{
        code: customCode,
        expires_at: expiresAt.toISOString()
      }]);
      if (insertError) throw insertError;
      showSuccess({
        title: 'Licença Criada!',
        description: `Licença ${customCode} criada com sucesso.`
      });
      setCustomCode('');
      fetchLicenseStats();
    } catch (error) {
      console.error('Error creating custom license:', error);
      showError({
        title: 'Erro ao Criar',
        description: 'Não foi possível criar a licença personalizada.'
      });
    } finally {
      setIsCreatingCustom(false);
    }
  };
  useEffect(() => {
    fetchLicenseStats();
  }, []);
  if (isLoading) {
    return <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  if (!stats) {
    return <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Não foi possível carregar as estatísticas.</p>
          <Button onClick={fetchLicenseStats} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>;
  }
  const statCards = [{
    title: 'Total de Licenças',
    value: stats.total_licenses,
    icon: Key,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900'
  }, {
    title: 'Licenças Ativas',
    value: stats.active_licenses,
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900'
  }, {
    title: 'Licenças Usadas',
    value: stats.used_licenses,
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900'
  }, {
    title: 'Licenças Disponíveis',
    value: stats.unused_licenses,
    icon: Plus,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900'
  }, {
    title: 'Expirando em Breve',
    value: stats.expiring_soon,
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900'
  }, {
    title: 'Licenças Expiradas',
    value: stats.expired_active,
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900'
  }, {
    title: 'Criadas Hoje',
    value: stats.created_today,
    icon: TrendingUp,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900'
  }, {
    title: 'Ativadas Hoje',
    value: stats.activated_today,
    icon: TrendingDown,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900'
  }];
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relatórios de Licenças</h2>
          <p className="text-muted-foreground">
            Última atualização: {new Date(stats.timestamp).toLocaleString('pt-BR')}
          </p>
        </div>
        <Button onClick={fetchLicenseStats} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-1 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
      })}
      </div>

      {/* Bulk License Creation */}
      

      {/* Custom License Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Criar Licença Personalizada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="custom-code">Código da Licença</Label>
              <div className="flex gap-2">
                <Input id="custom-code" value={customCode} onChange={e => setCustomCode(e.target.value)} placeholder="Insira o código desejado" />
                <Button type="button" variant="outline" size="icon" onClick={generateRandomCode} title="Gerar código aleatório">
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Qualquer combinação de caracteres ou use o botão para gerar</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="custom-days">Validade (dias)</Label>
              <Input id="custom-days" type="number" min="1" max="3650" value={customDays} onChange={e => setCustomDays(parseInt(e.target.value) || 365)} placeholder="365" />
              <p className="text-xs text-muted-foreground">Máximo: 3650 dias (10 anos)</p>
            </div>
          </div>

          <Button onClick={createCustomLicense} disabled={isCreatingCustom} className="w-full md:w-auto">
            {isCreatingCustom ? 'Criando...' : 'Criar Licença Personalizada'}
          </Button>
        </CardContent>
      </Card>

      {/* Summary Alerts */}
      {stats.expiring_soon > 0 && <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                Atenção: {stats.expiring_soon} licenças expiram em até 7 dias
              </span>
            </div>
          </CardContent>
        </Card>}

      {stats.expired_active > 0 && <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800 dark:text-red-200">
                Alerta: {stats.expired_active} licenças ativas estão expiradas
              </span>
            </div>
          </CardContent>
        </Card>}
    </div>;
};