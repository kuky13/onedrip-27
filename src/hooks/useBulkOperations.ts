import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  BulkOperation,
  BulkLicenseCreateRequest,
  BulkLicenseRenewRequest,
  BulkLicenseSuspendRequest,
  BulkLicenseDeleteRequest,
  UseBulkOperationsReturn
} from '../types/userLicense';

interface UseBulkOperationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxOperations?: number;
}

export function useBulkOperations(options: UseBulkOperationsOptions = {}): UseBulkOperationsReturn {
  const {
    autoRefresh = true,
    refreshInterval = 5000,
    maxOperations = 50
  } = options;

  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOperations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('user_license_bulk_operations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(maxOperations);

      if (queryError) {
        throw new Error(queryError.message);
      }

      setOperations((data || []).map(op => ({
        ...op,
        operation_type: op.operation_type as 'bulk_create' | 'bulk_renew' | 'bulk_suspend' | 'bulk_delete',
        status: op.status as 'pending' | 'processing' | 'completed' | 'failed'
      })));
    } catch (err) {
      console.error('Error fetching bulk operations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch operations');
    } finally {
      setLoading(false);
    }
  }, [maxOperations]);

  const createOperation = useCallback(async (
    type: string,
    userIds: string[],
    data: Record<string, any> = {}
  ): Promise<string> => {
    try {
      const { data: operationId, error: rpcError } = await supabase.rpc('admin_bulk_license_operation', {
        p_operation_type: type,
        p_user_ids: userIds,
        p_license_data: data
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      // Refresh operations list
      await fetchOperations();

      return operationId;
    } catch (err) {
      console.error('Error creating bulk operation:', err);
      throw err;
    }
  }, [fetchOperations]);

  const getOperationStatus = useCallback((operationId: string): BulkOperation | null => {
    return operations.find(op => op.id === operationId) || null;
  }, [operations]);

  // Initial fetch
  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  // Auto refresh for pending/processing operations
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const hasPendingOperations = operations.some(
      op => op.status === 'pending' || op.status === 'processing'
    );

    if (!hasPendingOperations) return;

    const interval = setInterval(() => {
      fetchOperations();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, operations, fetchOperations]);

  return {
    operations,
    loading,
    error,
    createOperation,
    getOperationStatus
  };
}

// Specialized hooks for different bulk operations
export function useBulkLicenseCreate() {
  const { createOperation } = useBulkOperations();

  const createLicenses = useCallback(async (request: BulkLicenseCreateRequest): Promise<string> => {
    return createOperation('bulk_create', request.user_ids, request.license_data);
  }, [createOperation]);

  return { createLicenses };
}

export function useBulkLicenseRenew() {
  const { createOperation } = useBulkOperations();

  const renewLicenses = useCallback(async (request: BulkLicenseRenewRequest): Promise<string> => {
    return createOperation('bulk_renew', request.user_ids, {
      extension_months: request.extension_months
    });
  }, [createOperation]);

  return { renewLicenses };
}

export function useBulkLicenseSuspend() {
  const { createOperation } = useBulkOperations();

  const suspendLicenses = useCallback(async (request: BulkLicenseSuspendRequest): Promise<string> => {
    return createOperation('bulk_suspend', request.user_ids, {
      reason: request.reason
    });
  }, [createOperation]);

  return { suspendLicenses };
}

export function useBulkLicenseDelete() {
  const { createOperation } = useBulkOperations();

  const deleteLicenses = useCallback(async (request: BulkLicenseDeleteRequest): Promise<string> => {
    return createOperation('bulk_delete', request.user_ids, {
      reason: request.reason
    });
  }, [createOperation]);

  return { deleteLicenses };
}

// Hook for monitoring operation progress
export function useOperationProgress(operationId: string | null) {
  const [operation, setOperation] = useState<BulkOperation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOperation = useCallback(async () => {
    if (!operationId) {
      setOperation(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('user_license_bulk_operations')
        .select('*')
        .eq('id', operationId)
        .single();

      if (queryError) {
        throw new Error(queryError.message);
      }

      setOperation({
        ...data,
        operation_type: data.operation_type as 'bulk_create' | 'bulk_renew' | 'bulk_suspend' | 'bulk_delete',
        status: data.status as 'pending' | 'processing' | 'completed' | 'failed'
      });
    } catch (err) {
      console.error('Error fetching operation:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch operation');
    } finally {
      setLoading(false);
    }
  }, [operationId]);

  // Auto refresh for pending/processing operations
  useEffect(() => {
    if (!operationId) return;

    fetchOperation();

    const interval = setInterval(() => {
      if (operation?.status === 'pending' || operation?.status === 'processing') {
        fetchOperation();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [operationId, operation?.status, fetchOperation]);

  const isCompleted = operation?.status === 'completed' || operation?.status === 'failed';
  const isProcessing = operation?.status === 'pending' || operation?.status === 'processing';
  const progress = operation?.results ? {
    total: operation.user_ids.length,
    completed: (operation.results.success_count || 0) + (operation.results.error_count || 0),
    success: operation.results.success_count || 0,
    errors: operation.results.error_count || 0
  } : null;

  return {
    operation,
    loading,
    error,
    isCompleted,
    isProcessing,
    progress,
    refetch: fetchOperation
  };
}