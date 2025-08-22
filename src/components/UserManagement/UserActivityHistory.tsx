import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  LogIn, 
  LogOut, 
  UserPlus, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  Filter,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: 'login' | 'logout' | 'created' | 'updated' | 'deleted' | 'license_renewed';
  description: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

interface UserActivityHistoryProps {
  userId?: string; // Se fornecido, mostra apenas atividades deste usuário
}

export const UserActivityHistory = ({ userId }: UserActivityHistoryProps) => {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7d');

  // Mock data - em produção, isso viria de uma API
  const mockActivities: ActivityLog[] = [
    {
      id: '1',
      user_id: 'user1',
      user_name: 'João Silva',
      action: 'login',
      description: 'Usuário fez login no sistema',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min atrás
      ip_address: '192.168.1.100'
    },
    {
      id: '2',
      user_id: 'user2',
      user_name: 'Maria Santos',
      action: 'created',
      description: 'Novo usuário criado no sistema',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h atrás
      ip_address: '192.168.1.101'
    },
    {
      id: '3',
      user_id: 'user1',
      user_name: 'João Silva',
      action: 'updated',
      description: 'Perfil do usuário foi atualizado',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h atrás
      ip_address: '192.168.1.100'
    },
    {
      id: '4',
      user_id: 'user3',
      user_name: 'Pedro Costa',
      action: 'license_renewed',
      description: 'Licença renovada por 30 dias',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6h atrás
      ip_address: '192.168.1.102'
    },
    {
      id: '5',
      user_id: 'user4',
      user_name: 'Ana Oliveira',
      action: 'logout',
      description: 'Usuário fez logout do sistema',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8h atrás
      ip_address: '192.168.1.103'
    }
  ];

  const getActionIcon = (action: string) => {
    const icons = {
      login: LogIn,
      logout: LogOut,
      created: UserPlus,
      updated: Edit,
      deleted: Trash2,
      license_renewed: Calendar
    };
    return icons[action as keyof typeof icons] || Activity;
  };

  const getActionColor = (action: string) => {
    const colors = {
      login: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      logout: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      created: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      updated: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      deleted: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      license_renewed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
    };
    return colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getActionLabel = (action: string) => {
    const labels = {
      login: 'Login',
      logout: 'Logout',
      created: 'Criado',
      updated: 'Atualizado',
      deleted: 'Deletado',
      license_renewed: 'Licença Renovada'
    };
    return labels[action as keyof typeof labels] || action;
  };

  const filteredActivities = mockActivities.filter(activity => {
    if (userId && activity.user_id !== userId) return false;
    if (filterAction !== 'all' && activity.action !== filterAction) return false;
    
    // Filtro por período
    const activityDate = new Date(activity.timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (timeRange) {
      case '1d': return diffDays <= 1;
      case '7d': return diffDays <= 7;
      case '30d': return diffDays <= 30;
      case '90d': return diffDays <= 90;
      default: return true;
    }
  });

  const exportActivities = () => {
    const csvContent = [
      ['Data/Hora', 'Usuário', 'Ação', 'Descrição', 'IP'].join(','),
      ...filteredActivities.map(activity => [
        format(new Date(activity.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
        activity.user_name,
        getActionLabel(activity.action),
        activity.description,
        activity.ip_address || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `atividades_usuarios_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Histórico de Atividades
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="created">Criado</SelectItem>
                <SelectItem value="updated">Atualizado</SelectItem>
                <SelectItem value="deleted">Deletado</SelectItem>
                <SelectItem value="license_renewed">Licença Renovada</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Hoje</SelectItem>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={exportActivities}>
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma atividade encontrada para os filtros selecionados.</p>
              </div>
            ) : (
              filteredActivities.map((activity) => {
                const ActionIcon = getActionIcon(activity.action);
                
                return (
                  <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <ActionIcon className="h-5 w-5" />
                      </div>
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{activity.user_name}</span>
                        <Badge className={getActionColor(activity.action)}>
                          {getActionLabel(activity.action)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(activity.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                        {activity.ip_address && (
                          <div>IP: {activity.ip_address}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};