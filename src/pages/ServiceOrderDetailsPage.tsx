/**
 * Página de Detalhes da Ordem de Serviço (VIP)
 * Sistema Oliver Blueberry - Mobile First Design
 */

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { useContextualActions } from '@/hooks/useContextualActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Upload,
  FileText,
  Image,
  Paperclip,
  Clock,
  User,
  Smartphone,
  Wrench,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  MessageSquare,
  Plus,
  Eye,
  ExternalLink
} from 'lucide-react';
import {
  useServiceOrderDetails,
  useServiceOrderEvents,
  useServiceOrderAttachments,
  useServiceOrderItems,
  useSecureServiceOrders
} from '@/hooks/useSecureServiceOrders';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Enums } from '@/integrations/supabase/types';

type ServiceOrderStatus = Enums<'service_order_status'>;
type ServiceOrderPriority = Enums<'service_order_priority'>;

interface StatusUpdateData {
  status: ServiceOrderStatus;
  notes?: string;
}

export const ServiceOrderDetailsPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Check if user has beta access
  const hasVipAccess = profile?.service_orders_vip_enabled || false;
  
  // State
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState<StatusUpdateData>({
    status: 'opened',
    notes: ''
  });
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newEventNote, setNewEventNote] = useState('');
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // Hooks
  const { data: serviceOrder, isLoading: isLoadingOrder } = useServiceOrderDetails(id);
  const { data: events, isLoading: isLoadingEvents } = useServiceOrderEvents(id);
  const { data: attachments, isLoading: isLoadingAttachments } = useServiceOrderAttachments(id);
  const { items, isLoading: isLoadingItems } = useServiceOrderItems(id);
  const { updateStatus: updateServiceOrderStatus, deleteServiceOrder, isUpdating, isDeleting } = useSecureServiceOrders(user?.id);

  // Contextual actions hook
  const { actions, executeAction, canExecuteAction, getStatusColor, getStatusText, getStatusIcon } = useContextualActions(serviceOrder);

  // Helper functions

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getEventIcon = (eventType: string) => {
    const icons = {
      status_change: RotateCcw,
      note_added: MessageSquare,
      item_added: Plus,
      attachment_added: Paperclip,
      created: CheckCircle
    };
    return icons[eventType as keyof typeof icons] || MessageSquare;
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return Image;
    }
    return FileText;
  };

  const handleStatusUpdate = async () => {
    if (!id || !user?.id) return;
    
    setIsUpdatingStatus(true);
    try {
      await updateServiceOrderStatus({
        id,
        status: statusUpdateData.status
      });
      
      setShowStatusUpdate(false);
      setStatusUpdateData({ status: 'opened', notes: '' });
      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddEvent = async () => {
    if (!id || !newEventNote.trim()) return;
    
    setIsAddingEvent(true);
    try {
      // This would be implemented in the hook
      // await addServiceOrderEvent({ serviceOrderId: id, note: newEventNote });
      setNewEventNote('');
      toast.success('Evento adicionado com sucesso!');
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Erro ao adicionar evento');
    } finally {
      setIsAddingEvent(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !user?.id) return;
    
    if (window.confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      try {
        await deleteServiceOrder(id);
        toast.success('Ordem de serviço excluída com sucesso!');
        navigate('/service-orders');
      } catch (error) {
        console.error('Error deleting service order:', error);
        toast.error('Erro ao excluir ordem de serviço');
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // This would be implemented to upload files
    toast.success(`${files.length} arquivo(s) selecionado(s) para upload`);
  };

  // Check authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">Você precisa estar logado para acessar esta página.</p>
          <Button onClick={() => navigate('/auth')}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  // Check beta access
  if (!hasVipAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Ordens de Serviço (VIP)</h1>
          <p className="text-muted-foreground mb-6">
            Esta funcionalidade é para usuarios VIP. Entre em contato com o suporte para solicitar acesso.
          </p>
          <Button onClick={() => navigate('/service-orders')} className="w-full">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ordem não encontrada</h1>
          <p className="text-muted-foreground mb-6">ID da ordem de serviço não foi fornecido.</p>
          <Button onClick={() => navigate('/service-orders')}>Voltar para Lista</Button>
        </div>
      </div>
    );
  }

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!serviceOrder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ordem não encontrada</h1>
          <p className="text-muted-foreground mb-6">A ordem de serviço solicitada não foi encontrada.</p>
          <Button onClick={() => navigate('/service-orders')}>Voltar para Lista</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/service-orders')}
              className="p-2 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Ordem #{serviceOrder.id.slice(-8)}</h1>
              <p className="text-sm text-muted-foreground">
                Criada em {format(new Date(serviceOrder.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/service-orders/${id}/edit`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Status and Priority */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(serviceOrder.status)}`}>
                  {getStatusIcon(serviceOrder.status)}
                  <span className="ml-1">{getStatusText(serviceOrder.status)}</span>
                </span>
                <Badge className={getPriorityColor(serviceOrder.priority)}>
                  {getPriorityLabel(serviceOrder.priority)}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatusUpdate(!showStatusUpdate)}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Atualizar Status
              </Button>
            </div>

            {showStatusUpdate && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <Select
                  value={statusUpdateData.status}
                  onValueChange={(value) => setStatusUpdateData(prev => ({ ...prev, status: value as ServiceOrderStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opened">Aberta</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Observações sobre a mudança de status (opcional)"
                  value={statusUpdateData.notes}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleStatusUpdate}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? 'Atualizando...' : 'Confirmar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStatusUpdate(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {serviceOrder.client_id && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Cliente ID: {serviceOrder.client_id}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Information */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Informações do Dispositivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{serviceOrder.device_model}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tipo:</span>
              <span className="text-sm">{serviceOrder.device_type}</span>
            </div>
            {serviceOrder.imei_serial && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">IMEI/Série:</span>
                <span className="text-sm">{serviceOrder.imei_serial}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Information */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Informações do Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Problema Relatado</h4>
              <p className="text-sm text-muted-foreground">{serviceOrder.reported_issue}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">Mão de Obra:</span>
                  <span className="text-sm ml-1">R$ {serviceOrder.labor_cost.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">Peças:</span>
                  <span className="text-sm ml-1">R$ {serviceOrder.parts_cost.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-sm font-medium">Total:</span>
                <span className="text-sm ml-1 font-bold">R$ {serviceOrder.total_price.toFixed(2)}</span>
              </div>
            </div>
            
            {serviceOrder.warranty_months && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Garantia: {serviceOrder.warranty_months} meses</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status do Pagamento:</span>
              <Badge variant={serviceOrder.is_paid ? 'default' : 'secondary'}>
                {serviceOrder.is_paid ? 'Pago' : 'Pendente'}
              </Badge>
            </div>
            
            {serviceOrder.delivery_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Data de Entrega: {new Date(serviceOrder.delivery_date).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
            
            {serviceOrder.notes && (
              <div>
                <h4 className="font-medium mb-2">Observações</h4>
                <p className="text-sm text-muted-foreground">{serviceOrder.notes}</p>
              </div>
            )}


          </CardContent>
        </Card>

        {/* Service Items */}
        {items && items.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Itens do Serviço ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.item_type} • Qtd: {item.quantity}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">R$ {item.unit_price.toFixed(2)}</div>
                      {item.warranty_months && (
                        <div className="text-xs text-muted-foreground">
                          Garantia: {item.warranty_months} meses
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attachments */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Anexos ({attachments?.length || 0})
              </div>
              <div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAttachments ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : attachments && attachments.length > 0 ? (
              <div className="space-y-3">
                {attachments.map((attachment) => {
                  const FileIcon = getFileIcon(attachment.file_name);
                  return (
                    <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{attachment.file_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {attachment.file_size && `${(attachment.file_size / 1024 / 1024).toFixed(2)} MB`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum anexo encontrado.</p>
                <p className="text-sm">Clique em "Adicionar" para enviar arquivos.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline/Events */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add Event */}
            <div className="mb-6 p-3 bg-muted/50 rounded-lg">
              <div className="space-y-3">
                <Textarea
                  placeholder="Adicionar nova observação ou evento..."
                  value={newEventNote}
                  onChange={(e) => setNewEventNote(e.target.value)}
                  rows={2}
                />
                <Button
                  size="sm"
                  onClick={handleAddEvent}
                  disabled={!newEventNote.trim() || isAddingEvent}
                >
                  {isAddingEvent ? 'Adicionando...' : 'Adicionar Evento'}
                </Button>
              </div>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-4">
                {isLoadingEvents ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : events && events.length > 0 ? (
                  events.map((event) => {
                    const EventIcon = getEventIcon(event.event_type);
                    return (
                      <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <EventIcon className="h-5 w-5" />
                          </div>
                        </div>
                        
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{event.event_type}</span>
                            <Badge variant="outline">
                              {event.event_type}
                            </Badge>
                          </div>
                          
                          {(event as any).payload?.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {(event as any).payload?.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum evento encontrado.</p>
                    <p className="text-sm">Os eventos aparecerão aqui conforme a ordem progride.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};