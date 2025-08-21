import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  History,
  User,
  Calendar,
  Edit,
  RefreshCw,
  Key,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRightLeft,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface License {
  id: string;
  code: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface LicenseHistoryEntry {
  id: string;
  license_id: string;
  action_type: 'created' | 'updated' | 'activated' | 'deactivated' | 'extended' | 'transferred' | 'expired';
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  admin_id: string;
  admin_name: string;
  admin_email: string;
  notes: string | null;
  created_at: string;
}

interface LicenseHistoryModalProps {
  license: License | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseHistoryModal = ({ license, isOpen, onClose }: LicenseHistoryModalProps) => {
  // Fetch license history
  const { data: history, isLoading } = useQuery({
    queryKey: ['license-history', license?.id],
    queryFn: async () => {
      if (!license?.id) return [];
      const { data, error } = await supabase.rpc('admin_get_license_history', {
        p_license_id: license.id
      });
      if (error) throw error;
      return data as LicenseHistoryEntry[];
    },
    enabled: isOpen && !!license?.id
  });

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'activated':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'deactivated':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'extended':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'transferred':
        return <ArrowRightLeft className="h-4 w-4 text-purple-600" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return 'Licença Criada';
      case 'updated':
        return 'Licença Atualizada';
      case 'activated':
        return 'Licença Ativada';
      case 'deactivated':
        return 'Licença Desativada';
      case 'extended':
        return 'Validade Estendida';
      case 'transferred':
        return 'Licença Transferida';
      case 'expired':
        return 'Licença Expirada';
      default:
        return 'Ação Desconhecida';
    }
  };

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case 'created':
      case 'activated':
        return 'default';
      case 'updated':
      case 'extended':
        return 'secondary';
      case 'transferred':
        return 'outline';
      case 'deactivated':
      case 'expired':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatChanges = (oldValues: Record<string, any> | null, newValues: Record<string, any> | null) => {
    if (!oldValues && !newValues) return null;
    
    const changes: string[] = [];
    
    if (oldValues && newValues) {
      Object.keys(newValues).forEach(key => {
        if (oldValues[key] !== newValues[key]) {
          const oldValue = oldValues[key];
          const newValue = newValues[key];
          
          switch (key) {
            case 'expires_at':
              const oldDate = oldValue ? format(new Date(oldValue), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Sem expiração';
              const newDate = newValue ? format(new Date(newValue), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Sem expiração';
              changes.push(`Expiração: ${oldDate} → ${newDate}`);
              break;
            case 'is_active':
              changes.push(`Status: ${oldValue ? 'Ativa' : 'Inativa'} → ${newValue ? 'Ativa' : 'Inativa'}`);
              break;
            case 'code':
              changes.push(`Código: ${oldValue} → ${newValue}`);
              break;
            case 'user_id':
              changes.push(`Usuário alterado`);
              break;
            default:
              changes.push(`${key}: ${oldValue} → ${newValue}`);
          }
        }
      });
    } else if (newValues) {
      // Creation or initial values
      if (newValues.expires_at) {
        const date = format(new Date(newValues.expires_at), 'dd/MM/yyyy HH:mm', { locale: ptBR });
        changes.push(`Expiração definida: ${date}`);
      }
      if (newValues.user_id) {
        changes.push(`Atribuída ao usuário`);
      }
    }
    
    return changes.length > 0 ? changes : null;
  };

  if (!license) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico da Licença
          </DialogTitle>
          <DialogDescription>
            Visualize todas as alterações realizadas na licença <code className="bg-muted px-2 py-1 rounded">{license.code}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* License Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">{license.code}</h3>
                    <p className="text-sm text-muted-foreground">
                      {license.user_name ? `${license.user_name} (${license.user_email})` : 'Não atribuída'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={license.is_active ? 'default' : 'secondary'}>
                    {license.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                  {license.expires_at && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Expira em {format(new Date(license.expires_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History Timeline */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Linha do Tempo
            </h4>
            
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : history && history.length > 0 ? (
              <div className="space-y-4">
                {history.map((entry, index) => {
                  const changes = formatChanges(entry.old_values, entry.new_values);
                  
                  return (
                    <div key={entry.id} className="relative">
                      {/* Timeline line */}
                      {index < history.length - 1 && (
                        <div className="absolute left-4 top-8 w-0.5 h-full bg-border" />
                      )}
                      
                      <div className="flex items-start gap-3">
                        {/* Action icon */}
                        <div className="flex-shrink-0 w-8 h-8 bg-background border-2 border-border rounded-full flex items-center justify-center">
                          {getActionIcon(entry.action_type)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getActionBadgeVariant(entry.action_type)}>
                              {getActionLabel(entry.action_type)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {entry.admin_name} ({entry.admin_email})
                            </span>
                          </div>
                          
                          {changes && (
                            <div className="bg-muted/50 p-3 rounded-lg mb-2">
                              <h5 className="text-sm font-medium mb-1">Alterações:</h5>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {changes.map((change, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-current rounded-full" />
                                    {change}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {entry.notes && (
                            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                              <h5 className="text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">
                                Observações:
                              </h5>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                {entry.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum histórico encontrado</h3>
                <p className="text-muted-foreground">
                  Esta licença ainda não possui histórico de alterações.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};