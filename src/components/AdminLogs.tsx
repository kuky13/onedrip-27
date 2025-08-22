
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, User, Shield } from 'lucide-react';

interface AdminLog {
  id: string;
  admin_user_id: string;
  admin_name: string;
  target_user_id: string;
  target_name: string;
  action: string;
  details: any;
  created_at: string;
}

export const AdminLogs = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_logs');
      
      if (error) throw error;
      return data as AdminLog[];
    },
  });

  const getActionBadge = (action: string) => {
    const colors: { [key: string]: string } = {
      user_profile_updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      user_deleted: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      user_created: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      user_license_renewed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    };
    return colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      user_profile_updated: 'Perfil Atualizado',
      user_deleted: 'Usuário Deletado',
      user_created: 'Usuário Criado',
      user_license_renewed: 'Licença Renovada',
    };
    return labels[action as keyof typeof labels] || action;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Logs de Atividade Administrativa</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs?.map((log) => (
            <div key={log.id} className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <Badge className={getActionBadge(log.action)}>
                    {getActionLabel(log.action)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                  </span>
                </div>
                <div className="text-sm">
                  <p>
                    <strong>Admin:</strong> {log.admin_name}
                  </p>
                  <p>
                    <strong>Usuário alvo:</strong> {log.target_name}
                  </p>
                  {log.details && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer text-primary hover:text-primary/80 text-sm">
                        Ver detalhes
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {logs?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log de atividade encontrado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
