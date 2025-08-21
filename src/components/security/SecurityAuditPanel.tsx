/**
 * Painel de Auditoria de Segurança
 * Sistema OneDrip Blueberry - Monitoramento de Segurança
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface RLSAuditResult {
  table_name: string;
  rls_enabled: boolean;
  policy_count: number;
  security_status: string;
  recommendations: string;
}

interface SecurityLog {
  id: string;
  action: string;
  details: any;
  created_at: string;
  admin_user_id: string;
}

export const SecurityAuditPanel = () => {
  // RLS Audit
  const { data: rlsAudit, isLoading: rlsLoading, refetch: refetchRLS } = useQuery({
    queryKey: ['rls-audit'],
    queryFn: async (): Promise<RLSAuditResult[]> => {
      const { data, error } = await supabase.rpc('audit_rls_policies');
      if (error) throw error;
      return data || [];
    },
    refetchOnWindowFocus: false
  });

  // Security Logs
  const { data: securityLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['security-logs'],
    queryFn: async (): Promise<SecurityLog[]> => {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .like('action', 'SECURITY_EVENT:%')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    refetchOnWindowFocus: false
  });

  // Cleanup old logs
  const handleCleanupLogs = async () => {
    try {
      const { data, error } = await supabase.rpc('cleanup_old_logs');
      if (error) throw error;
      
      toast.success(`${data} registros antigos removidos`);
      refetchRLS();
    } catch (error) {
      toast.error('Erro ao limpar logs antigos');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SEGURO':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'RLS SEM POLÍTICAS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'VULNERÁVEL - RLS DESABILITADO':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SEGURO':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'RLS SEM POLÍTICAS':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'VULNERÁVEL - RLS DESABILITADO':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const secureTablesCount = rlsAudit?.filter(table => table.security_status === 'SEGURO').length || 0;
  const vulnerableTablesCount = rlsAudit?.filter(table => 
    table.security_status === 'VULNERÁVEL - RLS DESABILITADO'
  ).length || 0;
  const warningTablesCount = rlsAudit?.filter(table => 
    table.security_status === 'RLS SEM POLÍTICAS'
  ).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Auditoria de Segurança</h2>
          <p className="text-muted-foreground">
            Monitoramento contínuo da segurança do banco de dados
          </p>
        </div>
        <Button onClick={() => refetchRLS()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tabelas Seguras</p>
                <p className="text-2xl font-bold text-green-600">{secureTablesCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avisos</p>
                <p className="text-2xl font-bold text-yellow-600">{warningTablesCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vulneráveis</p>
                <p className="text-2xl font-bold text-red-600">{vulnerableTablesCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{rlsAudit?.length || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RLS Audit Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Auditoria de Row Level Security (RLS)
          </CardTitle>
          <CardDescription>
            Status de segurança das tabelas do banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rlsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Carregando auditoria...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rlsAudit?.map((table) => (
                <div key={table.table_name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(table.security_status)}
                      <h4 className="font-medium">{table.table_name}</h4>
                      <Badge className={getStatusColor(table.security_status)}>
                        {table.security_status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {table.policy_count} políticas
                    </span>
                  </div>
                  
                  {table.recommendations !== 'Configuração segura' && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Recomendação:</strong> {table.recommendations}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Eventos de Segurança Recentes
              </CardTitle>
              <CardDescription>
                Últimos 20 eventos de segurança registrados
              </CardDescription>
            </div>
            <Button onClick={handleCleanupLogs} variant="outline" size="sm">
              Limpar Logs Antigos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Carregando logs...</p>
            </div>
          ) : securityLogs?.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
              <p className="text-muted-foreground mt-2">
                Nenhum evento de segurança registrado recentemente
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {securityLogs?.map((log) => (
                <div key={log.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {log.action.replace('SECURITY_EVENT: ', '')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  
                  {log.details && (
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityAuditPanel;