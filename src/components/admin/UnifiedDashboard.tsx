import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useLicenseMetrics, useLicenseExpirationAlerts, useLicenseRevenue } from '../../hooks/useLicenseStatistics';
import { useEnhancedUsers } from '../../hooks/useEnhancedUsers';
import type { UnifiedDashboardProps } from '../../types/userLicense';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

function MetricCard({ title, value, change, icon, trend = 'neutral', loading }: MetricCardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                ) : (
                  value
                )}
              </p>
            </div>
          </div>
          {change !== undefined && (
            <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface AlertCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  variant: 'warning' | 'error' | 'info';
  action?: () => void;
  actionLabel?: string;
}

function AlertCard({ title, count, icon, variant, action, actionLabel }: AlertCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className={getVariantStyles()}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={getIconColor()}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{title}</p>
              <p className="text-xl font-bold text-gray-900">{count}</p>
            </div>
          </div>
          {action && actionLabel && (
            <Button
              variant="outline"
              size="sm"
              onClick={action}
              className="text-xs"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function UnifiedDashboard({ onNavigate }: UnifiedDashboardProps) {
  const { metrics, loading: metricsLoading, error: metricsError, refresh: refreshMetrics } = useLicenseMetrics();
  const { alerts, loading: alertsLoading, refresh: refreshAlerts } = useLicenseExpirationAlerts();
  const { revenue, loading: revenueLoading } = useLicenseRevenue('month');
  const { users, loading: usersLoading, total } = useEnhancedUsers({
    filters: {},
    pagination: { limit: 1, offset: 0 }, // Just to get total count
    autoRefresh: true
  });

  const handleRefreshAll = () => {
    refreshMetrics();
    refreshAlerts();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getRevenueTrend = (): 'up' | 'down' | 'neutral' => {
    if (!revenue || revenue.growth === 0) return 'neutral';
    return revenue.growth > 0 ? 'up' : 'down';
  };

  if (metricsError) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Erro ao carregar dados do dashboard: {metricsError}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Unificado</h1>
          <p className="text-gray-600">Visão geral de usuários e licenças</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefreshAll}
          disabled={metricsLoading || alertsLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${metricsLoading || alertsLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Usuários"
          value={total || 0}
          icon={<Users className="h-5 w-5 text-blue-500" />}
          loading={usersLoading}
        />
        <MetricCard
          title="Licenças Ativas"
          value={metrics?.activeLicenses || 0}
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          loading={metricsLoading}
        />
        <MetricCard
          title="Receita Mensal"
          value={revenue ? formatCurrency(revenue.current) : 'R$ 0,00'}
          change={revenue?.growth}
          trend={getRevenueTrend()}
          icon={<DollarSign className="h-5 w-5 text-green-500" />}
          loading={revenueLoading}
        />
        <MetricCard
          title="Novas Licenças"
          value={metrics?.newThisMonth || 0}
          icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
          loading={metricsLoading}
        />
      </div>

      {/* Alerts and Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AlertCard
          title="Expirando em Breve"
          count={alerts?.expiringSoon || 0}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
          action={() => onNavigate?.('licenses')}
          actionLabel="Ver Detalhes"
        />
        <AlertCard
          title="Expiraram Hoje"
          count={alerts?.expiredToday || 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="error"
          action={() => onNavigate?.('licenses')}
          actionLabel="Renovar"
        />
        <AlertCard
          title="Licenças Suspensas"
          count={metrics?.suspendedLicenses || 0}
          icon={<Activity className="h-5 w-5" />}
          variant="info"
          action={() => onNavigate?.('licenses')}
          actionLabel="Gerenciar"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* License Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Visão Geral de Licenças</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total de Licenças</span>
                <Badge variant="secondary">{metrics?.totalLicenses || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Licenças Expiradas</span>
                <Badge variant="destructive">{metrics?.expiredLicenses || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Renovações este Mês</span>
                <Badge variant="default">{metrics?.renewedThisMonth || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Duração Média</span>
                <Badge variant="outline">
                  {metrics?.averageLicenseDuration ? `${metrics.averageLicenseDuration} dias` : 'N/A'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top License Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Tipos de Licença Populares</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.topLicenseTypes?.slice(0, 5).map((type, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{type.type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(type.count / (metrics.topLicenseTypes?.[0]?.count || 1)) * 100}%`
                        }}
                      />
                    </div>
                    <Badge variant="outline">{type.count}</Badge>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum dado disponível
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => onNavigate?.('users')}
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Gerenciar Usuários</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate?.('licenses')}
              className="flex items-center space-x-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Gerenciar Licenças</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate?.('bulk-operations')}
              className="flex items-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>Operações em Lote</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate?.('analytics')}
              className="flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Relatórios</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UnifiedDashboard;