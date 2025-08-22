import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trash2, RotateCcw, AlertTriangle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DeletedServiceOrder {
  id: string;
  owner_id: string;
  client_id: string | null;
  device_type: string;
  device_model: string;
  imei_serial: string | null;
  reported_issue: string;
  status: string;
  priority: string;
  total_price: number;
  labor_cost: number;
  parts_cost: number;
  is_paid: boolean;
  delivery_date: string | null;
  warranty_months: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  deleted_by: string;
}

const ServiceOrderTrash: React.FC = () => {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Fetch deleted service orders
  const { data: deletedOrders, isLoading, error } = useQuery({
    queryKey: ['deletedServiceOrders'],
    queryFn: async (): Promise<DeletedServiceOrder[]> => {
      const { data, error } = await supabase.rpc('get_deleted_service_orders');
      if (error) throw error;
      return data || [];
    },
  });

  // Restore service order mutation
  const restoreOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.rpc('restore_service_order', {
        service_order_id: orderId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletedServiceOrders'] });
      queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      toast.success('Ordem de serviço restaurada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao restaurar ordem de serviço: ${error.message}`);
    },
  });

  // Hard delete service order mutation
  const hardDeleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.rpc('hard_delete_service_order', {
        service_order_id: orderId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletedServiceOrders'] });
      toast.success('Ordem de serviço excluída permanentemente!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir permanentemente: ${error.message}`);
    },
  });

  // Empty trash mutation
  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('empty_service_orders_trash');
      if (error) throw error;
      return data;
    },
    onSuccess: (deletedCount: number) => {
      queryClient.invalidateQueries({ queryKey: ['deletedServiceOrders'] });
      toast.success(`${deletedCount} ordens de serviço excluídas permanentemente!`);
    },
    onError: (error: any) => {
      toast.error(`Erro ao esvaziar lixeira: ${error.message}`);
    },
  });

  const handleRestore = (orderId: string) => {
    restoreOrderMutation.mutate(orderId);
  };

  const handleHardDelete = (orderId: string) => {
    hardDeleteOrderMutation.mutate(orderId);
  };

  const handleEmptyTrash = () => {
    emptyTrashMutation.mutate();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'alta':
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'média':
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'baixa':
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendente':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'em andamento':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'concluído':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando lixeira...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Erro ao carregar lixeira: {(error as Error).message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lixeira</h1>
          <p className="text-muted-foreground">
            Ordens de serviço excluídas ({deletedOrders?.length || 0})
          </p>
        </div>
        {deletedOrders && deletedOrders.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Esvaziar Lixeira
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Esvaziar Lixeira
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá excluir permanentemente todas as {deletedOrders.length} ordens de serviço da lixeira.
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleEmptyTrash}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={emptyTrashMutation.isPending}
                >
                  {emptyTrashMutation.isPending ? 'Excluindo...' : 'Excluir Permanentemente'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {!deletedOrders || deletedOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lixeira vazia</h3>
            <p className="text-muted-foreground text-center">
              Não há ordens de serviço excluídas no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {deletedOrders.map((order) => (
            <Card key={order.id} className="border-l-4 border-l-red-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      Ordem #{order.id.slice(0, 8)}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Excluída {formatDistanceToNow(new Date(order.deleted_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(order.priority)}>
                      {order.priority}
                    </Badge>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Dispositivo:</span>
                      <span className="ml-2">{order.device_type} {order.device_model}</span>
                    </div>
                    {order.imei_serial && (
                      <div>
                        <span className="font-medium">IMEI/Serial:</span>
                        <span className="ml-2">{order.imei_serial}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className="ml-2">{order.status}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Preço Total:</span>
                      <span className="ml-2">R$ {order.total_price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Mão de obra:</span>
                      <span className="ml-2">R$ {order.labor_cost.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Peças:</span>
                      <span className="ml-2">R$ {order.parts_cost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                {order.reported_issue && (
                  <div className="mb-4">
                    <span className="font-medium">Problema Relatado:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.reported_issue}
                    </p>
                  </div>
                )}

                {order.notes && (
                  <div className="mb-4">
                    <span className="font-medium">Observações:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {order.is_paid ? 'Pago' : 'Não Pago'}
                    </span>
                    {order.warranty_months && (
                      <span>
                        <span className="font-medium">Garantia:</span> {order.warranty_months} meses
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(order.id)}
                      disabled={restoreOrderMutation.isPending}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restaurar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          Excluir Permanentemente
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Excluir Permanentemente
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação irá excluir permanentemente a ordem de serviço #{order.id.slice(0, 8)}.
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleHardDelete(order.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={hardDeleteOrderMutation.isPending}
                          >
                            {hardDeleteOrderMutation.isPending ? 'Excluindo...' : 'Excluir Permanentemente'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export { ServiceOrderTrash };