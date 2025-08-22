/**
 * Hook Seguro e Otimizado para Gestão de Ordens de Serviço
 * Sistema Oliver Blueberry - Performance + Segurança
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { validateInput, clientRateLimit, logSecurityEvent } from '@/utils/security/inputValidation';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/types';

type ServiceOrder = Tables<'service_orders'>;
type ServiceOrderInsert = TablesInsert<'service_orders'>;
type ServiceOrderUpdate = TablesUpdate<'service_orders'>;
type ServiceOrderItem = Tables<'service_order_items'>;
type ServiceOrderEvent = Tables<'service_order_events'>;
type ServiceOrderAttachment = Tables<'service_order_attachments'>;
type ServiceOrderStatus = Enums<'service_order_status'>;
type ServiceOrderPriority = Enums<'service_order_priority'>;

interface ServiceOrderFilters {
  search?: string;
  status?: ServiceOrderStatus;
  priority?: ServiceOrderPriority;
  device_type?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

interface ServiceOrderWithDetails extends ServiceOrder {
  items_count?: number;
  events_count?: number;
  attachments_count?: number;
}

interface ServiceOrderStats {
  total_orders: number;
  opened_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  delivered_orders: number;
  total_revenue: number;
  avg_completion_time: number;
}

/**
 * Função para validar se uma string é um UUID válido
 */
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Hook principal para gestão segura de ordens de serviço
 */
export const useSecureServiceOrders = (userId: string | undefined, filters: ServiceOrderFilters = {}) => {
  const queryClient = useQueryClient();

  // Query direta do Supabase com filtros manuais
  const serviceOrdersQuery = useQuery({
    queryKey: ['secure-service-orders', userId, filters],
    queryFn: async (): Promise<ServiceOrder[]> => {
      if (!userId) return [];
      
      // Validar se userId é um UUID válido
      if (!isValidUUID(userId)) {
        logSecurityEvent('INVALID_USER_ID_UUID', { userId: String(userId).substring(0, 10) + '...' });
        return [];
      }

      // Validar entrada de busca
      if (filters.search) {
        const validation = validateInput(filters.search, 'search');
        if (!validation.isValid) {
          logSecurityEvent('INVALID_SEARCH_INPUT', {
            threats: validation.threats,
            input: filters.search.substring(0, 50)
          }, 'high');
          throw new Error('Termo de busca inválido');
        }
        filters.search = validation.sanitized;
      }

      // Rate limiting
      const rateLimitKey = `service-orders-${userId}`;
      if (!clientRateLimit.checkLimit(rateLimitKey, 10, 60000)) {
        logSecurityEvent('RATE_LIMIT_EXCEEDED', { userId, action: 'fetch_service_orders' });
        throw new Error('Muitas solicitações. Tente novamente em alguns minutos.');
      }

      try {
        // Usar query direta do Supabase
        let query = supabase
          .from('service_orders')
          .select('*')
          .eq('owner_id', userId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        // Aplicar filtros
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        if (filters.priority) {
          query = query.eq('priority', filters.priority);
        }
        
        if (filters.device_type) {
          query = query.eq('device_type', filters.device_type);
        }
        
        if (filters.date_from) {
          query = query.gte('created_at', filters.date_from);
        }
        
        if (filters.date_to) {
          query = query.lte('created_at', filters.date_to);
        }
        
        if (filters.search) {
          query = query.or(`device_type.ilike.%${filters.search}%,imei_serial.ilike.%${filters.search}%,reported_issue.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
        }
        
        // Aplicar paginação
        if (filters.offset) {
          query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
        } else {
          query = query.limit(filters.limit || 50);
        }

        const { data, error } = await query;

        if (error) {
          logSecurityEvent('DATABASE_ERROR', { error: error.message, userId });
          throw error;
        }

        return data || [];
      } catch (error) {
        logSecurityEvent('SERVICE_ORDER_FETCH_ERROR', { error, userId });
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Não retry em erros de segurança
      if (error.message.includes('inválido') || error.message.includes('Rate limit')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Mutation para criar ordem de serviço com validação
  const createServiceOrderMutation = useMutation({
    mutationFn: async (serviceOrderData: ServiceOrderInsert) => {
      // Validar userId antes de prosseguir
      if (!userId || !isValidUUID(userId)) {
        logSecurityEvent('INVALID_USER_ID_CREATE', { userId: userId?.substring(0, 10) + '...' || 'undefined' });
        throw new Error('ID do usuário inválido');
      }
      
      // Validação completa dos dados
      const validationResults = {
        device_type: validateInput(serviceOrderData.device_type, 'form'),
        imei_serial: serviceOrderData.imei_serial ? validateInput(serviceOrderData.imei_serial, 'form') : { isValid: true, sanitized: null, threats: [] },
        reported_issue: validateInput(serviceOrderData.reported_issue, 'form'),
        notes: serviceOrderData.notes ? validateInput(serviceOrderData.notes, 'form') : { isValid: true, sanitized: null, threats: [] }
      };

      // Verificar se alguma validação falhou
      const hasInvalidInput = Object.values(validationResults).some(v => !v.isValid);
      if (hasInvalidInput) {
        const threats = Object.values(validationResults)
          .flatMap(v => v.threats)
          .filter((threat, index, arr) => arr.indexOf(threat) === index);
        
        logSecurityEvent('INVALID_SERVICE_ORDER_DATA', { threats }, 'high');
        throw new Error('Dados da ordem de serviço contêm caracteres inválidos');
      }

      // Sanitizar dados e garantir owner_id
      const sanitizedData: ServiceOrderInsert = {
        ...serviceOrderData,
        device_type: validationResults.device_type.sanitized,
        imei_serial: validationResults.imei_serial.sanitized,
        reported_issue: validationResults.reported_issue.sanitized,
        notes: validationResults.notes.sanitized,
        owner_id: userId,
        status: serviceOrderData.status || 'opened',
        labor_cost: serviceOrderData.labor_cost || 0,
        parts_cost: serviceOrderData.parts_cost || 0,
        total_price: serviceOrderData.total_price || 0,
        is_paid: serviceOrderData.is_paid || false
      };

      const { data, error } = await supabase
        .from('service_orders')
        .insert([sanitizedData])
        .select()
        .single();

      if (error) {
        logSecurityEvent('SERVICE_ORDER_CREATE_ERROR', { error: error.message });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-service-orders'] });
      toast.success('Ordem de serviço criada com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao criar ordem de serviço: ${error.message}`);
    }
  });

  // Mutation para atualizar ordem de serviço
  const updateServiceOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ServiceOrderUpdate }) => {
      // Validar userId
      if (!userId || !isValidUUID(userId)) {
        logSecurityEvent('INVALID_USER_ID_UPDATE', { userId: userId?.substring(0, 10) + '...' || 'undefined' });
        throw new Error('ID do usuário inválido');
      }
      
      // Validar ID da ordem de serviço
      if (!id || typeof id !== 'string' || !isValidUUID(id)) {
        logSecurityEvent('INVALID_SERVICE_ORDER_ID', { id });
        throw new Error('ID da ordem de serviço inválido');
      }

      // Validar dados se fornecidos
      const sanitizedData: ServiceOrderUpdate = { ...data };
      
      if (data.device_type) {
        const validation = validateInput(data.device_type, 'form');
        if (!validation.isValid) {
          logSecurityEvent('INVALID_UPDATE_DATA', { field: 'device_type' });
          throw new Error('Tipo do dispositivo inválido');
        }
        sanitizedData.device_type = validation.sanitized;
      }

      if (data.imei_serial) {
        const validation = validateInput(data.imei_serial, 'form');
        if (!validation.isValid) {
          logSecurityEvent('INVALID_UPDATE_DATA', { field: 'imei_serial' });
          throw new Error('IMEI/Serial inválido');
        }
        sanitizedData.imei_serial = validation.sanitized;
      }

      if (data.reported_issue) {
        const validation = validateInput(data.reported_issue, 'form');
        if (!validation.isValid) {
          logSecurityEvent('INVALID_UPDATE_DATA', { field: 'reported_issue' });
          throw new Error('Problema reportado inválido');
        }
        sanitizedData.reported_issue = validation.sanitized;
      }

      const { data: result, error } = await supabase
        .from('service_orders')
        .update(sanitizedData)
        .eq('id', id)
        .eq('owner_id', userId)
        .select()
        .single();

      if (error) {
        logSecurityEvent('SERVICE_ORDER_UPDATE_ERROR', { error: error.message, serviceOrderId: id });
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-service-orders'] });
      toast.success('Ordem de serviço atualizada com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar ordem de serviço: ${error.message}`);
    }
  });

  // Mutation para atualizar status da ordem de serviço
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ServiceOrderStatus }) => {
      // Validar userId
      if (!userId || !isValidUUID(userId)) {
        logSecurityEvent('INVALID_USER_ID_STATUS', { userId: userId?.substring(0, 10) + '...' || 'undefined' });
        throw new Error('ID do usuário inválido');
      }
      
      // Validar ID da ordem de serviço
      if (!id || typeof id !== 'string' || !isValidUUID(id)) {
        logSecurityEvent('INVALID_SERVICE_ORDER_ID', { id });
        throw new Error('ID da ordem de serviço inválido');
      }

      // Atualizar status diretamente
      const { data, error } = await supabase
        .from('service_orders')
        .update({ 
          status
        })
        .eq('id', id)
        .eq('owner_id', userId)
        .select()
        .single();

      if (error) {
        logSecurityEvent('SERVICE_ORDER_STATUS_UPDATE_ERROR', { error: error.message, serviceOrderId: id });
        throw error;
      }

      // Criar evento de mudança de status
      await supabase
        .from('service_order_events')
        .insert({
          service_order_id: id,
          event_type: 'status_changed',
          payload: { description: `Status alterado para: ${status}`, new_status: status },
          created_by: userId
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-service-orders'] });
      toast.success('Status atualizado com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    }
  });

  // Mutation para excluir ordem de serviço (soft delete)
  const deleteServiceOrderMutation = useMutation({
    mutationFn: async (serviceOrderId: string) => {
      // Validar userId
      if (!userId || !isValidUUID(userId)) {
        logSecurityEvent('INVALID_USER_ID_DELETE', { userId: userId?.substring(0, 10) + '...' || 'undefined' });
        throw new Error('ID do usuário inválido');
      }
      
      // Validar ID da ordem de serviço
      if (!serviceOrderId || typeof serviceOrderId !== 'string' || !isValidUUID(serviceOrderId)) {
        logSecurityEvent('INVALID_DELETE_ID', { serviceOrderId });
        throw new Error('ID da ordem de serviço inválido');
      }

      // Usar a função RPC soft_delete_service_order
      const { data, error } = await supabase
        .rpc('soft_delete_service_order', {
          p_service_order_id: serviceOrderId
        });

      if (error) {
        logSecurityEvent('SERVICE_ORDER_DELETE_ERROR', { error: error.message, serviceOrderId });
        throw error;
      }

      if (!data) {
        throw new Error('Falha ao excluir ordem de serviço');
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['deletedServiceOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-service-orders-count'] });
      toast.success('Ordem de serviço excluída com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao excluir ordem de serviço: ${error.message}`);
    }
  });

  // Mutation para restaurar ordem de serviço (desfazer soft delete)
  const restoreServiceOrderMutation = useMutation({
    mutationFn: async (serviceOrderId: string) => {
      // Validar userId
      if (!userId || !isValidUUID(userId)) {
        logSecurityEvent('INVALID_USER_ID_RESTORE', { userId: userId?.substring(0, 10) + '...' || 'undefined' });
        throw new Error('ID do usuário inválido');
      }
      
      // Validar ID da ordem de serviço
      if (!serviceOrderId || typeof serviceOrderId !== 'string' || !isValidUUID(serviceOrderId)) {
        logSecurityEvent('INVALID_RESTORE_ID', { serviceOrderId });
        throw new Error('ID da ordem de serviço inválido');
      }

      // Usar a função RPC restore_service_order
      const { data, error } = await supabase
        .rpc('restore_service_order', {
          p_service_order_id: serviceOrderId
        });

      if (error) {
        logSecurityEvent('SERVICE_ORDER_RESTORE_ERROR', { error: error.message, serviceOrderId });
        throw error;
      }

      if (!data) {
        throw new Error('Falha ao restaurar ordem de serviço');
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['deletedServiceOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-service-orders-count'] });
      toast.success('Ordem de serviço restaurada com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao restaurar ordem de serviço: ${error.message}`);
    }
  });

  // Mutation para excluir permanentemente ordem de serviço (hard delete)
  const hardDeleteServiceOrderMutation = useMutation({
    mutationFn: async (serviceOrderId: string) => {
      // Validar userId
      if (!userId || !isValidUUID(userId)) {
        logSecurityEvent('INVALID_USER_ID_HARD_DELETE', { userId: userId?.substring(0, 10) + '...' || 'undefined' });
        throw new Error('ID do usuário inválido');
      }
      
      // Validar ID da ordem de serviço
      if (!serviceOrderId || typeof serviceOrderId !== 'string' || !isValidUUID(serviceOrderId)) {
        logSecurityEvent('INVALID_HARD_DELETE_ID', { serviceOrderId });
        throw new Error('ID da ordem de serviço inválido');
      }

      // Usar a função RPC hard_delete_service_order
      const { data, error } = await supabase
        .rpc('hard_delete_service_order', {
          service_order_id: serviceOrderId
        });

      if (error) {
        logSecurityEvent('SERVICE_ORDER_HARD_DELETE_ERROR', { error: error.message, serviceOrderId });
        throw error;
      }

      if (!data) {
        throw new Error('Falha ao excluir permanentemente ordem de serviço');
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletedServiceOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-service-orders-count'] });
      toast.success('Ordem de serviço excluída permanentemente');
    },
    onError: (error) => {
      toast.error(`Erro ao excluir permanentemente: ${error.message}`);
    }
  });

  // Mutation para esvaziar lixeira (excluir permanentemente todas as ordens soft-deleted)
  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      // Validar userId
      if (!userId || !isValidUUID(userId)) {
        logSecurityEvent('INVALID_USER_ID_EMPTY_TRASH', { userId: userId?.substring(0, 10) + '...' || 'undefined' });
        throw new Error('ID do usuário inválido');
      }

      // Usar a função RPC empty_service_orders_trash
      const { data, error } = await supabase
        .rpc('empty_service_orders_trash');

      if (error) {
        logSecurityEvent('SERVICE_ORDER_EMPTY_TRASH_ERROR', { error: error.message });
        throw error;
      }

      return data; // Retorna o número de ordens excluídas
    },
    onSuccess: (deletedCount: number) => {
      queryClient.invalidateQueries({ queryKey: ['deletedServiceOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-service-orders-count'] });
      toast.success(`${deletedCount} ordens de serviço excluídas permanentemente`);
    },
    onError: (error) => {
      toast.error(`Erro ao esvaziar lixeira: ${error.message}`);
    }
  });

  // Garantir que serviceOrders sempre seja um array válido
  const serviceOrders = React.useMemo(() => {
    if (serviceOrdersQuery.data && Array.isArray(serviceOrdersQuery.data)) {
      return serviceOrdersQuery.data;
    }
    return [];
  }, [serviceOrdersQuery.data]);

  return {
    // Data
    serviceOrders,
    isLoading: serviceOrdersQuery.isLoading,
    error: serviceOrdersQuery.error,
    
    // Mutations
    createServiceOrder: createServiceOrderMutation.mutate,
    updateServiceOrder: updateServiceOrderMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    deleteServiceOrder: deleteServiceOrderMutation.mutate,
    restoreServiceOrder: restoreServiceOrderMutation.mutate,
    hardDeleteServiceOrder: hardDeleteServiceOrderMutation.mutate,
    emptyTrash: emptyTrashMutation.mutate,
    
    // States
    isCreating: createServiceOrderMutation.isPending,
    isUpdating: updateServiceOrderMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isDeleting: deleteServiceOrderMutation.isPending,
    isRestoring: restoreServiceOrderMutation.isPending,
    isHardDeleting: hardDeleteServiceOrderMutation.isPending,
    isEmptyingTrash: emptyTrashMutation.isPending,
    
    // Utils
    refetch: serviceOrdersQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['secure-service-orders'] })
  };
};

/**
 * Hook para obter detalhes completos de uma ordem de serviço
 */
export const useServiceOrderDetails = (serviceOrderId: string | undefined) => {
  return useQuery({
    queryKey: ['service-order-details', serviceOrderId],
    queryFn: async (): Promise<ServiceOrderWithDetails | null> => {
      if (!serviceOrderId) return null;
      
      // Validar se serviceOrderId é um UUID válido
      if (!isValidUUID(serviceOrderId)) {
        logSecurityEvent('INVALID_SERVICE_ORDER_ID_DETAILS', { serviceOrderId: String(serviceOrderId).substring(0, 10) + '...' });
        return null;
      }

      // Query direta para obter detalhes da ordem de serviço
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('id', serviceOrderId)
        .is('deleted_at', null)
        .single();

      if (error) {
        logSecurityEvent('SERVICE_ORDER_DETAILS_ERROR', { error: error.message, serviceOrderId });
        throw error;
      }

      // Buscar contagens relacionadas
      const [itemsCount, eventsCount, attachmentsCount] = await Promise.all([
        supabase.from('service_order_items').select('id', { count: 'exact' }).eq('service_order_id', serviceOrderId).is('deleted_at', null),
        supabase.from('service_order_events').select('id', { count: 'exact' }).eq('service_order_id', serviceOrderId),
        supabase.from('service_order_attachments').select('id', { count: 'exact' }).eq('service_order_id', serviceOrderId).is('deleted_at', null)
      ]);

      return {
        ...data,
        items_count: itemsCount.count || 0,
        events_count: eventsCount.count || 0,
        attachments_count: attachmentsCount.count || 0
      };
    },
    enabled: !!serviceOrderId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchOnWindowFocus: false
  });
};

/**
 * Hook para estatísticas de ordens de serviço
 */
export const useServiceOrderStats = (userId: string | undefined, dateRange?: { from?: string; to?: string }) => {
  return useQuery({
    queryKey: ['service-order-stats', userId, dateRange],
    queryFn: async (): Promise<ServiceOrderStats | null> => {
      if (!userId) return null;
      
      // Validar se userId é um UUID válido
      if (!isValidUUID(userId)) {
        logSecurityEvent('INVALID_USER_ID_STATS', { userId: String(userId).substring(0, 10) + '...' });
        return null;
      }

      try {
        // Query base para ordens de serviço do usuário
        let baseQuery = supabase
          .from('service_orders')
          .select('status, total_price, created_at')
          .eq('owner_id', userId)
          .is('deleted_at', null);

        // Aplicar filtros de data se fornecidos
        if (dateRange?.from) {
          baseQuery = baseQuery.gte('created_at', dateRange.from);
        }
        if (dateRange?.to) {
          baseQuery = baseQuery.lte('created_at', dateRange.to);
        }

        const { data: orders, error } = await baseQuery;

        if (error) {
          logSecurityEvent('SERVICE_ORDER_STATS_ERROR', { error: error.message, userId });
          throw error;
        }

        if (!orders) return null;

        // Calcular estatísticas
        const stats: ServiceOrderStats = {
          total_orders: orders.length,
          opened_orders: orders.filter(o => o.status === 'opened').length,
          in_progress_orders: orders.filter(o => o.status === 'in_progress').length,
          completed_orders: orders.filter(o => o.status === 'completed').length,
          delivered_orders: orders.filter(o => o.status === 'delivered').length,
          total_revenue: orders.reduce((sum, order) => sum + (order.total_price || 0), 0),
          avg_completion_time: 0 // Calcular se necessário
        };

        // Tempo médio de conclusão desabilitado (sem coluna completed_at)
        stats.avg_completion_time = 0;

        return stats;
      } catch (error) {
        logSecurityEvent('SERVICE_ORDER_STATS_ERROR', { error, userId });
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: false
  });
};

/**
 * Hook para itens de uma ordem de serviço
 */
export const useServiceOrderItems = (serviceOrderId: string | undefined) => {
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ['service-order-items', serviceOrderId],
    queryFn: async (): Promise<ServiceOrderItem[]> => {
      if (!serviceOrderId) return [];
      
      // Validar se serviceOrderId é um UUID válido
      if (!isValidUUID(serviceOrderId)) {
        logSecurityEvent('INVALID_SERVICE_ORDER_ID_ITEMS', { serviceOrderId: String(serviceOrderId).substring(0, 10) + '...' });
        return [];
      }

      const { data, error } = await supabase
        .from('service_order_items')
        .select('*')
        .eq('service_order_id', serviceOrderId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) {
        logSecurityEvent('SERVICE_ORDER_ITEMS_ERROR', { error: error.message, serviceOrderId });
        throw error;
      }

      return data || [];
    },
    enabled: !!serviceOrderId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false
  });

  const addItemMutation = useMutation({
    mutationFn: async (itemData: Omit<TablesInsert<'service_order_items'>, 'service_order_id'>) => {
      if (!serviceOrderId) throw new Error('ID da ordem de serviço é obrigatório');
      
      // Validar se serviceOrderId é um UUID válido
      if (!isValidUUID(serviceOrderId)) {
        logSecurityEvent('INVALID_SERVICE_ORDER_ID_ADD_ITEM', { serviceOrderId: String(serviceOrderId).substring(0, 10) + '...' });
        throw new Error('ID da ordem de serviço inválido');
      }

      // Validar dados do item
      const validation = validateInput(itemData.name, 'form');
      if (!validation.isValid) {
        logSecurityEvent('INVALID_ITEM_DATA', { threats: validation.threats });
        throw new Error('Nome do item inválido');
      }

      const { data, error } = await supabase
        .from('service_order_items')
        .insert([{
          ...itemData,
          name: validation.sanitized,
          service_order_id: serviceOrderId
        }])
        .select()
        .single();

      if (error) {
        logSecurityEvent('SERVICE_ORDER_ITEM_CREATE_ERROR', { error: error.message });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-order-items', serviceOrderId] });
      queryClient.invalidateQueries({ queryKey: ['secure-service-orders'] });
      toast.success('Item adicionado com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar item: ${error.message}`);
    }
  });

  // Garantir que items sempre seja um array válido
  const items = React.useMemo(() => {
    if (itemsQuery.data && Array.isArray(itemsQuery.data)) {
      return itemsQuery.data;
    }
    return [];
  }, [itemsQuery.data]);

  return {
    items,
    isLoading: itemsQuery.isLoading,
    error: itemsQuery.error,
    addItem: addItemMutation.mutate,
    isAddingItem: addItemMutation.isPending,
    refetch: itemsQuery.refetch
  };
};

/**
 * Hook para eventos/timeline de uma ordem de serviço
 */
export const useServiceOrderEvents = (serviceOrderId: string | undefined) => {
  const eventsQuery = useQuery({
    queryKey: ['service-order-events', serviceOrderId],
    queryFn: async (): Promise<ServiceOrderEvent[]> => {
      if (!serviceOrderId) return [];
      
      // Validar se serviceOrderId é um UUID válido
      if (!isValidUUID(serviceOrderId)) {
        logSecurityEvent('INVALID_SERVICE_ORDER_ID_EVENTS', { serviceOrderId: String(serviceOrderId).substring(0, 10) + '...' });
        return [];
      }

      const { data, error } = await supabase
        .from('service_order_events')
        .select('*')
        .eq('service_order_id', serviceOrderId)
        .order('created_at', { ascending: false });

      if (error) {
        logSecurityEvent('SERVICE_ORDER_EVENTS_ERROR', { error: error.message, serviceOrderId });
        throw error;
      }

      return data || [];
    },
    enabled: !!serviceOrderId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchOnWindowFocus: false
  });

  // Garantir que events sempre seja um array válido
  const events = React.useMemo(() => {
    if (eventsQuery.data && Array.isArray(eventsQuery.data)) {
      return eventsQuery.data;
    }
    return [];
  }, [eventsQuery.data]);

  return {
    data: events,
    isLoading: eventsQuery.isLoading,
    error: eventsQuery.error,
    refetch: eventsQuery.refetch
  };
};

/**
 * Hook para anexos de uma ordem de serviço
 */
export const useServiceOrderAttachments = (serviceOrderId: string | undefined) => {
  const attachmentsQuery = useQuery({
    queryKey: ['service-order-attachments', serviceOrderId],
    queryFn: async (): Promise<ServiceOrderAttachment[]> => {
      if (!serviceOrderId) return [];
      
      // Validar se serviceOrderId é um UUID válido
      if (!isValidUUID(serviceOrderId)) {
        logSecurityEvent('INVALID_SERVICE_ORDER_ID_ATTACHMENTS', { serviceOrderId: String(serviceOrderId).substring(0, 10) + '...' });
        return [];
      }

      const { data, error } = await supabase
        .from('service_order_attachments')
        .select('*')
        .eq('service_order_id', serviceOrderId)
        .order('created_at', { ascending: false });

      if (error) {
        logSecurityEvent('SERVICE_ORDER_ATTACHMENTS_ERROR', { error: error.message, serviceOrderId });
        throw error;
      }

      return data || [];
    },
    enabled: !!serviceOrderId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false
  });

  // Garantir que attachments sempre seja um array válido
  const attachments = React.useMemo(() => {
    if (attachmentsQuery.data && Array.isArray(attachmentsQuery.data)) {
      return attachmentsQuery.data;
    }
    return [];
  }, [attachmentsQuery.data]);

  return {
    data: attachments,
    isLoading: attachmentsQuery.isLoading,
    error: attachmentsQuery.error,
    refetch: attachmentsQuery.refetch
  };
};

/**
 * Hook para buscar o número de ordens de serviço excluídas (lixeira)
 */
export const useDeletedServiceOrdersCount = (userId: string | undefined) => {
  const deletedCountQuery = useQuery({
    queryKey: ['deleted-service-orders-count', userId],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;
      
      // Validar se userId é um UUID válido
      if (!isValidUUID(userId)) {
        logSecurityEvent('INVALID_USER_ID_DELETED_COUNT', { userId: userId?.substring(0, 10) + '...' || 'undefined' });
        return 0;
      }

      try {
        const { data, error } = await supabase.rpc('get_deleted_service_orders');
        
        if (error) {
          logSecurityEvent('DELETED_SERVICE_ORDERS_COUNT_ERROR', { error: error.message, userId });
          throw error;
        }

        return data ? data.length : 0;
      } catch (error) {
        logSecurityEvent('DELETED_SERVICE_ORDERS_COUNT_FETCH_ERROR', { error, userId });
        return 0;
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchOnWindowFocus: false,
    retry: 1
  });

  return {
    count: deletedCountQuery.data || 0,
    isLoading: deletedCountQuery.isLoading,
    error: deletedCountQuery.error,
    refetch: deletedCountQuery.refetch
  };
};