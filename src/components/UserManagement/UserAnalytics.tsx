import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  UserCheck, 
  UserX, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Shield,
  Crown,
  User as UserIcon
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User } from '@/types/user';

interface UserAnalyticsProps {
  users: User[];
}

export const UserAnalytics = ({ users }: UserAnalyticsProps) => {
  const analytics = useMemo(() => {
    const now = new Date();
    const last7Days = subDays(now, 7);
    const last30Days = subDays(now, 30);

    // Usuários criados nos últimos períodos
    const usersLast7Days = users.filter(u => new Date(u.created_at) >= last7Days).length;
    const usersLast30Days = users.filter(u => new Date(u.created_at) >= last30Days).length;
    
    // Usuários ativos (com login recente)
    const activeUsersLast7Days = users.filter(u => 
      u.last_sign_in_at && new Date(u.last_sign_in_at) >= last7Days
    ).length;
    
    // Distribuição por função
    const roleDistribution = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Distribuição por status
    const activeUsers = users.filter(u => u.license_active).length;
    const inactiveUsers = users.length - activeUsers;

    // Usuários por período de criação
    const usersByMonth = users.reduce((acc, user) => {
      const month = format(new Date(user.created_at), 'yyyy-MM');
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top usuários por orçamentos
    const topUsersByBudgets = [...users]
      .sort((a, b) => b.budget_count - a.budget_count)
      .slice(0, 5);

    // Usuários sem login recente (mais de 30 dias)
    const inactiveLoginUsers = users.filter(u => 
      !u.last_sign_in_at || new Date(u.last_sign_in_at) < last30Days
    );

    // Taxa de crescimento
    const growthRate = usersLast30Days > 0 ? 
      ((usersLast7Days * 4 - usersLast30Days) / usersLast30Days * 100) : 0;

    return {
      total: users.length,
      usersLast7Days,
      usersLast30Days,
      activeUsersLast7Days,
      roleDistribution,
      activeUsers,
      inactiveUsers,
      usersByMonth,
      topUsersByBudgets,
      inactiveLoginUsers: inactiveLoginUsers.length,
      growthRate
    };
  }, [users]);

  const getRoleIcon = (role: string) => {
    const icons = {
      admin: Shield,
      manager: Crown,
      user: UserIcon
    };
    return icons[role as keyof typeof icons] || UserIcon;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      user: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
    };
    return colors[role as keyof typeof colors] || colors.user;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administradores',
      manager: 'Gerentes',
      user: 'Usuários'
    };
    return labels[role as keyof typeof labels] || 'Usuários';
  };

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                <p className="text-3xl font-bold">{analytics.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2">
              {analytics.growthRate >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${analytics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(analytics.growthRate).toFixed(1)}% este mês
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                <p className="text-3xl font-bold">{analytics.activeUsers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Progress 
                value={(analytics.activeUsers / analytics.total) * 100} 
                className="h-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {((analytics.activeUsers / analytics.total) * 100).toFixed(1)}% do total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Novos (7 dias)</p>
                <p className="text-3xl font-bold">{analytics.usersLast7Days}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {analytics.usersLast30Days} nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Login Recente</p>
                <p className="text-3xl font-bold">{analytics.activeUsersLast7Days}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Últimos 7 dias
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por função */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição por Função
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.roleDistribution).map(([role, count]) => {
                const RoleIcon = getRoleIcon(role);
                const percentage = (count / analytics.total) * 100;
                
                return (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RoleIcon className="h-4 w-4" />
                      <span className="font-medium">{getRoleLabel(role)}</span>
                      <Badge className={getRoleColor(role)}>
                        {count}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={percentage} className="w-20 h-2" />
                      <span className="text-sm text-muted-foreground w-12">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top usuários por orçamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Usuários por Orçamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topUsersByBudgets.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {user.budget_count} orçamentos
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="h-5 w-5" />
              Usuários Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Sem login há mais de 30 dias</span>
                <Badge variant="outline" className="text-orange-600">
                  {analytics.inactiveLoginUsers} usuários
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Licenças inativas</span>
                <Badge variant="outline" className="text-red-600">
                  {analytics.inactiveUsers} usuários
                </Badge>
              </div>
              {analytics.inactiveLoginUsers > 0 && (
                <p className="text-sm text-muted-foreground">
                  Considere entrar em contato com estes usuários para reengajamento.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Insights de Crescimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Taxa de Ativação</p>
                <p className="text-sm text-muted-foreground">
                  {((analytics.activeUsers / analytics.total) * 100).toFixed(1)}% dos usuários têm licenças ativas
                </p>
                <Progress 
                  value={(analytics.activeUsers / analytics.total) * 100} 
                  className="h-2 mt-2"
                />
              </div>
              
              <div>
                <p className="font-medium">Engajamento Recente</p>
                <p className="text-sm text-muted-foreground">
                  {((analytics.activeUsersLast7Days / analytics.total) * 100).toFixed(1)}% fizeram login na última semana
                </p>
                <Progress 
                  value={(analytics.activeUsersLast7Days / analytics.total) * 100} 
                  className="h-2 mt-2"
                />
              </div>

              {analytics.growthRate > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    📈 Crescimento positivo de {analytics.growthRate.toFixed(1)}% este mês!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};