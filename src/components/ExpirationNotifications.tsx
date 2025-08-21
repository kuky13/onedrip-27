import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, AlertTriangle, Eye } from 'lucide-react';
import { useAdvancedBudgets } from '@/hooks/useAdvancedBudgets';
import { EmptyState } from '@/components/EmptyState';

interface ExpirationNotificationsProps {
  onViewBudget?: (budgetId: string) => void;
  compact?: boolean;
}

export const ExpirationNotifications = ({ onViewBudget, compact = false }: ExpirationNotificationsProps) => {
  const { expiringBudgets, hasExpiringBudgets, isAdvancedMode } = useAdvancedBudgets();

  if (!isAdvancedMode) {
    return null;
  }

  if (!hasExpiringBudgets) {
    return compact ? null : (
      <Card className="glass-card shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Bell className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-xl">Notificações</CardTitle>
              <CardDescription>
                Acompanhe orçamentos que estão vencendo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Calendar}
            title="Nenhum orçamento vencendo"
            description="Todos os seus orçamentos estão dentro do prazo de validade."
          />
        </CardContent>
      </Card>
    );
  }

  const urgentBudgets = expiringBudgets.filter(b => b.days_until_expiry <= 1);
  const soonBudgets = expiringBudgets.filter(b => b.days_until_expiry > 1);

  const formatDaysUntilExpiry = (days: number) => {
    if (days < 0) return `Vencido há ${Math.abs(days)} dia(s)`;
    if (days === 0) return 'Vence hoje';
    if (days === 1) return 'Vence amanhã';
    return `Vence em ${days} dias`;
  };

  const getStatusColor = (days: number) => {
    if (days < 0) return 'destructive';
    if (days <= 1) return 'secondary';
    return 'outline';
  };

  const getStatusIcon = (days: number) => {
    if (days < 0) return AlertTriangle;
    return Calendar;
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {urgentBudgets.slice(0, 3).map((budget) => {
          const StatusIcon = getStatusIcon(budget.days_until_expiry);
          return (
            <div
              key={budget.budget_id}
              className="flex items-center justify-between p-3 rounded-lg border bg-background/50"
            >
              <div className="flex items-center gap-3">
                <StatusIcon className="h-4 w-4 text-destructive" />
                <div>
                  <p className="font-medium text-sm">{budget.client_name || 'Cliente não identificado'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDaysUntilExpiry(budget.days_until_expiry)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewBudget?.(budget.budget_id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card className="glass-card shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Bell className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-xl">Notificações</CardTitle>
              <CardDescription>
                {expiringBudgets.length} orçamento(s) precisam de atenção
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-700">
            {expiringBudgets.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {urgentBudgets.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Urgente ({urgentBudgets.length})
            </h4>
            {urgentBudgets.map((budget) => {
              const StatusIcon = getStatusIcon(budget.days_until_expiry);
              return (
                <div
                  key={budget.budget_id}
                  className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5"
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon className="h-4 w-4 text-destructive" />
                    <div>
                      <p className="font-medium text-sm">{budget.client_name || 'Cliente não identificado'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDaysUntilExpiry(budget.days_until_expiry)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewBudget?.(budget.budget_id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {soonBudgets.length > 0 && (
          <div className="space-y-3">
            {urgentBudgets.length > 0 && <hr className="border-border/50" />}
            <h4 className="font-medium text-sm text-amber-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximos do vencimento ({soonBudgets.length})
            </h4>
            {soonBudgets.map((budget) => (
              <div
                key={budget.budget_id}
                className="flex items-center justify-between p-3 rounded-lg border bg-background/50"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="font-medium text-sm">{budget.client_name || 'Cliente não identificado'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDaysUntilExpiry(budget.days_until_expiry)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewBudget?.(budget.budget_id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};