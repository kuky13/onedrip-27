// @ts-nocheck - Temporary suppression for type issues
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
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
} from '../ui/alert-dialog';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  CreditCard,
  Calendar,
  FileText,
  Download,
  Trash2,
  Eye,
  Plus
} from 'lucide-react';
import { useBulkOperations, useOperationProgress } from '../../hooks/useBulkOperations';
import type {
  BulkOperationsPanelProps,
  BulkOperation,
  BulkOperationRequest,
  BulkOperationType
} from '../../types/userLicense';

interface BulkOperationFormData {
  type: BulkOperationType;
  user_ids: string[];
  license_data?: {
    type: string;
    expires_at: string;
    max_devices: number;
    features: string[];
  };
  notes?: string;
}

interface OperationRowProps {
  operation: BulkOperation;
  onView: (operation: BulkOperation) => void;
  onCancel: (operationId: string) => void;
  onDelete: (operationId: string) => void;
}

function OperationRow({ operation, onView, onCancel, onDelete }: OperationRowProps) {
  const { progress, status } = useOperationProgress(operation.id);
  
  const getStatusIcon = () => {
    switch (status || operation.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    const currentStatus = status || operation.status;
    switch (currentStatus) {
      case 'completed':
        return <Badge className="bg-green-500">Concluída</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'running':
        return <Badge className="bg-blue-500">Executando</Badge>;
      case 'paused':
        return <Badge variant="secondary">Pausada</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelada</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const getOperationTypeLabel = (type: BulkOperationType) => {
    switch (type) {
      case 'create_license':
        return 'Criar Licenças';
      case 'renew_license':
        return 'Renovar Licenças';
      case 'suspend_license':
        return 'Suspender Licenças';
      case 'delete_license':
        return 'Excluir Licenças';
      default:
        return type;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const currentProgress = progress?.percentage || operation.progress || 0;
  const canCancel = (status || operation.status) === 'running';
  const canDelete = ['completed', 'failed', 'cancelled'].includes(status || operation.status);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <div>
            <p className="font-medium">{getOperationTypeLabel(operation.type)}</p>
            <p className="text-sm text-gray-500">ID: {operation.id.slice(0, 8)}...</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span>{operation.total_users} usuários</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          {getStatusBadge()}
          {(status === 'running' || operation.status === 'running') && (
            <div className="w-full">
              <Progress value={currentProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">{currentProgress.toFixed(1)}%</p>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div>
          <p className="text-sm">{formatDate(operation.created_at)}</p>
          {operation.completed_at && (
            <p className="text-xs text-gray-500">
              Concluída: {formatDate(operation.completed_at)}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" onClick={() => onView(operation)}>
            <Eye className="h-4 w-4" />
          </Button>
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-yellow-600">
                  <Square className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar Operação</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja cancelar esta operação? O progresso atual será perdido.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Não</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onCancel(operation.id)} className="bg-yellow-600 hover:bg-yellow-700">
                    Cancelar Operação
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Operação</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o histórico desta operação? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(operation.id)} className="bg-red-600 hover:bg-red-700">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function BulkOperationForm({ selectedUsers, onSubmit, onCancel }: {
  selectedUsers: string[];
  onSubmit: (data: BulkOperationFormData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<BulkOperationFormData>({
    type: 'create_license',
    user_ids: selectedUsers,
    license_data: {
      type: 'basic',
      expires_at: '',
      max_devices: 1,
      features: []
    },
    notes: ''
  });

  const availableFeatures = [
    'api_access',
    'advanced_analytics',
    'priority_support',
    'custom_branding',
    'bulk_operations',
    'export_data',
    'integrations'
  ];

  const requiresLicenseData = ['create_license', 'renew_license'].includes(formData.type);

  const handleFeatureToggle = (feature: string) => {
    if (!formData.license_data) return;
    
    setFormData(prev => ({
      ...prev,
      license_data: {
        ...prev.license_data!,
        features: prev.license_data!.features.includes(feature)
          ? prev.license_data!.features.filter(f => f !== feature)
          : [...prev.license_data!.features, feature]
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      license_data: requiresLicenseData ? formData.license_data : undefined
    });
  };

  const getOperationDescription = () => {
    switch (formData.type) {
      case 'create_license':
        return 'Criar novas licenças para os usuários selecionados';
      case 'renew_license':
        return 'Renovar licenças existentes dos usuários selecionados';
      case 'suspend_license':
        return 'Suspender licenças ativas dos usuários selecionados';
      case 'delete_license':
        return 'Excluir licenças dos usuários selecionados';
      default:
        return '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-900">
            {selectedUsers.length} usuário(s) selecionado(s)
          </span>
        </div>
        <p className="text-sm text-blue-700">
          Esta operação será aplicada a todos os usuários selecionados.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Tipo de Operação</label>
        <Select 
          value={formData.type} 
          onValueChange={(value: BulkOperationType) => setFormData(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="create_license">Criar Licenças</SelectItem>
            <SelectItem value="renew_license">Renovar Licenças</SelectItem>
            <SelectItem value="suspend_license">Suspender Licenças</SelectItem>
            <SelectItem value="delete_license">Excluir Licenças</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-600 mt-1">{getOperationDescription()}</p>
      </div>

      {requiresLicenseData && formData.license_data && (
        <div className="space-y-4 border rounded-lg p-4">
          <h4 className="font-medium flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Configurações da Licença</span>
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tipo de Licença</label>
              <Select 
                value={formData.license_data.type} 
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  license_data: { ...prev.license_data!, type: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básica</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Data de Expiração</label>
              <Input
                type="date"
                value={formData.license_data.expires_at}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  license_data: { ...prev.license_data!, expires_at: e.target.value }
                }))}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Máximo de Dispositivos</label>
            <Input
              type="number"
              min="1"
              value={formData.license_data.max_devices}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                license_data: { ...prev.license_data!, max_devices: parseInt(e.target.value) }
              }))}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Recursos</label>
            <div className="grid grid-cols-2 gap-2">
              {availableFeatures.map((feature) => (
                <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.license_data!.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="rounded"
                  />
                  <span className="text-sm">{feature.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Observações</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Observações sobre esta operação em lote..."
          rows={3}
        />
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Atenção</p>
            <p className="text-sm text-yellow-700">
              Esta operação será executada em {selectedUsers.length} usuário(s). 
              Verifique cuidadosamente as configurações antes de prosseguir.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          <Play className="h-4 w-4 mr-2" />
          Executar Operação
        </Button>
      </div>
    </form>
  );
}

function OperationDetailsDialog({ operation, open, onClose }: {
  operation: BulkOperation | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!operation) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const getOperationTypeLabel = (type: BulkOperationType) => {
    switch (type) {
      case 'create_license':
        return 'Criar Licenças';
      case 'renew_license':
        return 'Renovar Licenças';
      case 'suspend_license':
        return 'Suspender Licenças';
      case 'delete_license':
        return 'Excluir Licenças';
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Operação</DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre a operação em lote
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tipo</p>
              <p className="font-medium">{getOperationTypeLabel(operation.type)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge className={operation.status === 'completed' ? 'bg-green-500' : 
                operation.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'}>
                {operation.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total de Usuários</p>
              <p className="font-medium">{operation.total_users}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Progresso</p>
              <div className="space-y-1">
                <Progress value={operation.progress || 0} className="h-2" />
                <p className="text-sm">{(operation.progress || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Criada em</p>
              <p className="font-medium">{formatDate(operation.created_at)}</p>
            </div>
            {operation.completed_at && (
              <div>
                <p className="text-sm text-gray-600">Concluída em</p>
                <p className="font-medium">{formatDate(operation.completed_at)}</p>
              </div>
            )}
          </div>

          {operation.license_data && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Configurações da Licença</p>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <p><span className="font-medium">Tipo:</span> {operation.license_data.type}</p>
                <p><span className="font-medium">Expira em:</span> {new Date(operation.license_data.expires_at).toLocaleDateString('pt-BR')}</p>
                <p><span className="font-medium">Dispositivos:</span> {operation.license_data.max_devices}</p>
                {operation.license_data.features && operation.license_data.features.length > 0 && (
                  <div>
                    <span className="font-medium">Recursos:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {operation.license_data.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {operation.notes && (
            <div>
              <p className="text-sm text-gray-600">Observações</p>
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{operation.notes}</p>
            </div>
          )}

          {operation.error && (
            <div>
              <p className="text-sm text-gray-600">Erro</p>
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{operation.error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BulkOperationsPanel({ selectedUsers, onClearSelection }: BulkOperationsPanelProps) {
  const [showNewOperationForm, setShowNewOperationForm] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [showOperationDetails, setShowOperationDetails] = useState(false);

  const {
    operations,
    loading,
    error,
    createBulkOperation,
    cancelOperation,
    deleteOperation,
    refresh
  } = useBulkOperations();

  const handleCreateOperation = async (data: BulkOperationFormData) => {
    try {
      await createBulkOperation({
        type: data.type,
        user_ids: data.user_ids,
        license_data: data.license_data,
        notes: data.notes
      });
      
      setShowNewOperationForm(false);
      onClearSelection?.();
      refresh();
    } catch (err) {
      console.error('Erro ao criar operação:', err);
    }
  };

  const handleViewOperation = (operation: BulkOperation) => {
    setSelectedOperation(operation);
    setShowOperationDetails(true);
  };

  const handleCancelOperation = async (operationId: string) => {
    try {
      await cancelOperation(operationId);
      refresh();
    } catch (err) {
      console.error('Erro ao cancelar operação:', err);
    }
  };

  const handleDeleteOperation = async (operationId: string) => {
    try {
      await deleteOperation(operationId);
      refresh();
    } catch (err) {
      console.error('Erro ao excluir operação:', err);
    }
  };

  const runningOperations = operations.filter(op => op.status === 'running');
  const recentOperations = operations.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Operações em Lote</h2>
          <p className="text-gray-600">
            Gerencie operações de licença em massa
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={refresh}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
          <Dialog open={showNewOperationForm} onOpenChange={setShowNewOperationForm}>
            <DialogTrigger asChild>
              <Button 
                disabled={!selectedUsers || selectedUsers.length === 0}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nova Operação</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Nova Operação em Lote</DialogTitle>
                <DialogDescription>
                  Configure uma nova operação para ser executada nos usuários selecionados.
                </DialogDescription>
              </DialogHeader>
              {selectedUsers && selectedUsers.length > 0 && (
                <BulkOperationForm
                  selectedUsers={selectedUsers}
                  onSubmit={handleCreateOperation}
                  onCancel={() => setShowNewOperationForm(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Selection Info */}
      {selectedUsers && selectedUsers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-blue-900 font-medium">
                  {selectedUsers.length} usuário(s) selecionado(s) para operação em lote
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearSelection}
                className="text-blue-700 border-blue-300"
              >
                Limpar Seleção
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Running Operations */}
      {runningOperations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
              <span>Operações em Execução</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {runningOperations.map((operation) => (
                <div key={operation.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="font-medium">
                        {operation.type === 'create_license' ? 'Criando Licenças' :
                         operation.type === 'renew_license' ? 'Renovando Licenças' :
                         operation.type === 'suspend_license' ? 'Suspendendo Licenças' :
                         'Excluindo Licenças'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelOperation(operation.id)}
                    >
                      Cancelar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{operation.total_users} usuários</span>
                      <span>{(operation.progress || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={operation.progress || 0} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operations History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Histórico de Operações</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center space-x-2 text-red-600 p-4">
              <AlertTriangle className="h-5 w-5" />
              <span>Erro ao carregar operações: {error}</span>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : recentOperations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma operação encontrada</p>
              <p className="text-sm text-gray-400">As operações em lote aparecerão aqui</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operação</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOperations.map((operation) => (
                  <OperationRow
                    key={operation.id}
                    operation={operation}
                    onView={handleViewOperation}
                    onCancel={handleCancelOperation}
                    onDelete={handleDeleteOperation}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Operation Details Dialog */}
      <OperationDetailsDialog
        operation={selectedOperation}
        open={showOperationDetails}
        onClose={() => {
          setShowOperationDetails(false);
          setSelectedOperation(null);
        }}
      />
    </div>
  );
}

export default BulkOperationsPanel;