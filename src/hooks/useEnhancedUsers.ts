import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  EnhancedUser,
  UserListFilters,
  UserListSorting,
  PaginationParams,
  UseEnhancedUsersReturn
} from '../types/userLicense';

interface UseEnhancedUsersOptions {
  filters?: UserListFilters;
  sorting?: UserListSorting;
  pagination?: PaginationParams;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const DEFAULT_PAGINATION: PaginationParams = {
  limit: 50,
  offset: 0
};

const DEFAULT_SORTING: UserListSorting = {
  sort_by: 'created_at',
  sort_order: 'desc'
};

export function useEnhancedUsers(options: UseEnhancedUsersOptions = {}): UseEnhancedUsersReturn {
  const {
    filters = {},
    sorting = DEFAULT_SORTING,
    pagination = DEFAULT_PAGINATION,
    autoRefresh = false,
    refreshInterval = 30000
  } = options;

  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchUsers = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : pagination.offset;
      
      const { data, error: rpcError } = await supabase.rpc('admin_get_enhanced_users', {
        p_limit: pagination.limit,
        p_offset: currentOffset,
        p_search: filters.search || null,
        p_license_status: filters.license_status || null,
        p_sort_by: sorting.sort_by,
        p_sort_order: sorting.sort_order
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const newUsers = data || [];
      
      if (reset || currentOffset === 0) {
        setUsers(newUsers);
      } else {
        setUsers(prev => [...prev, ...newUsers]);
      }

      setHasMore(newUsers.length === pagination.limit);
      
      // Get total count for pagination info
      if (reset || currentOffset === 0) {
        const { count } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });
        setTotal(count || 0);
      }

    } catch (err) {
      console.error('Error fetching enhanced users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [filters, sorting, pagination]);

  const refetch = useCallback(() => {
    fetchUsers(true);
  }, [fetchUsers]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchUsers(false);
    }
  }, [fetchUsers, loading, hasMore]);

  // Initial fetch
  useEffect(() => {
    fetchUsers(true);
  }, [filters, sorting, pagination]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  return {
    users,
    loading,
    error,
    total,
    hasMore,
    refetch,
    loadMore
  };
}

// Hook for managing user selection in bulk operations
export function useUserSelection() {
  const [selectedUsers, setSelectedUsers] = useState<EnhancedUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const selectUser = useCallback((user: EnhancedUser) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.id === user.id);
      if (exists) {
        return prev.filter(u => u.id !== user.id);
      }
      return [...prev, user];
    });
    
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(user.id)) {
        newSet.delete(user.id);
      } else {
        newSet.add(user.id);
      }
      return newSet;
    });
  }, []);

  const selectAllUsers = useCallback((users: EnhancedUser[]) => {
    setSelectedUsers(users);
    setSelectedUserIds(new Set(users.map(u => u.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedUsers([]);
    setSelectedUserIds(new Set());
  }, []);

  const isSelected = useCallback((userId: string) => {
    return selectedUserIds.has(userId);
  }, [selectedUserIds]);

  return {
    selectedUsers,
    selectedUserIds: Array.from(selectedUserIds),
    selectUser,
    selectAllUsers,
    clearSelection,
    isSelected,
    selectedCount: selectedUsers.length
  };
}