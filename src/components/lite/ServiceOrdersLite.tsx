import React, { useState } from 'react';
import { ArrowLeft, Plus, Search, Filter, Wrench, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSecureServiceOrders } from '@/hooks/useSecureServiceOrders';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/animations/micro-interactions';
import { PageTransition } from '@/components/ui/animations/page-transitions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ServiceOrdersLiteProps {
  userId: string;
  onBack: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'opened':
      return <Clock className="h-4 w-4" />;
    case 'in_progress':
      return <Wrench className="h-4 w-4" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'delivered':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'opened':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'delivered':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'opened':
      return 'Aberta';
    case 'in_progress':
      return 'Em Andamento';
    case 'completed':
      return 'Concluído';
    case 'delivered':
      return 'Entregue';
    default:
      return 'Aberta';
  }
};

export const ServiceOrdersLite = ({ userId, onBack }: ServiceOrdersLiteProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const {
    serviceOrders,
    isLoading,
    error
  } = useSecureServiceOrders(userId, {
    search: searchTerm || undefined,
    status: statusFilter === 'all' ? undefined : (statusFilter as any)
  });

  const handleCreateNew = () => {
    navigate('/service-orders/new');
  };

  const handleViewDetails = (id: string) => {
    navigate(`/service-orders/${id}`);
  };

  if (isLoading) {
    return (
      <PageTransition type="slideLeft">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Skeleton className="h-9 w-24" />
          </div>
          
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    const errorMessage = String((error as any)?.message || error || 'Erro desconhecido ao carregar ordens');
    
    return (
      <PageTransition type="slideLeft">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          
          <GlassCard className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar ordens</h3>
            <p className="text-muted-foreground">{errorMessage}</p>
          </GlassCard>
        </div>
      </PageTransition>
    );
  }

  const filteredOrders = serviceOrders?.filter(order => {
    const matchesSearch = !searchTerm || 
      order.device_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.reported_issue?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <PageTransition type="slideLeft">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <Button size="sm" onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Ordem
          </Button>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Ordens de Serviço VIP</h1>
          <p className="text-muted-foreground">Gerencie suas ordens de serviço</p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, dispositivo ou serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'opened', label: 'Aberta' },
              { value: 'in_progress', label: 'Em Andamento' },
              { value: 'completed', label: 'Concluído' },
              { value: 'delivered', label: 'Entregue' }
            ].map((status) => (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status.value)}
                className="whitespace-nowrap"
              >
                {status.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Service Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== 'all' ? 'Nenhuma ordem encontrada' : 'Nenhuma ordem de serviço'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Crie sua primeira ordem de serviço para começar'
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Ordem
                </Button>
              )}
            </GlassCard>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewDetails(order.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {order.device_model || 'Dispositivo'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {order.device_type}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(order.status)} flex items-center gap-1`}
                      >
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {order.reported_issue || 'Sem descrição'}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Criado em {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        {order.total_price && (
                          <span className="font-medium text-foreground">
                            R$ {Number(order.total_price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
};