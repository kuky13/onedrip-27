import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  UserLicenseAnalytics,
  AnalyticsDateRange,
  UseLicenseAnalyticsReturn
} from '../types/userLicense';

interface UseLicenseAnalyticsOptions {
  userId?: string;
  dateRange?: AnalyticsDateRange;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useLicenseAnalytics(options: UseLicenseAnalyticsOptions = {}): UseLicenseAnalyticsReturn {
  const {
    userId,
    dateRange,
    limit = 100,
    autoRefresh = false,
    refreshInterval = 30000
  } = options;

  const [analytics, setAnalytics] = useState<UserLicenseAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('admin_get_user_license_analytics', {
        p_user_id: userId || null,
        p_start_date: dateRange?.start_date || null,
        p_end_date: dateRange?.end_date || null,
        p_limit: limit
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setAnalytics(data || []);
    } catch (err) {
      console.error('Error fetching license analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [userId, dateRange, limit]);

  const refetch = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  return {
    analytics,
    loading,
    error,
    refetch
  };
}

// Hook for aggregated analytics data
export function useAggregatedAnalytics(dateRange?: AnalyticsDateRange) {
  const [data, setData] = useState<{
    daily_stats: Array<{
      date: string;
      created: number;
      renewed: number;
      suspended: number;
      deleted: number;
    }>;
    action_summary: Record<string, number>;
    user_activity: Array<{
      user_email: string;
      action_count: number;
      last_action: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAggregatedData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch raw analytics data
      const { data: analyticsData, error: analyticsError } = await supabase.rpc('admin_get_user_license_analytics', {
        p_user_id: null,
        p_start_date: dateRange?.start_date || null,
        p_end_date: dateRange?.end_date || null,
        p_limit: 1000
      });

      if (analyticsError) {
        throw new Error(analyticsError.message);
      }

      const analytics = analyticsData || [];

      // Process data for daily stats
      const dailyStatsMap = new Map<string, {
        created: number;
        renewed: number;
        suspended: number;
        deleted: number;
      }>();

      const actionSummary: Record<string, number> = {
        created: 0,
        renewed: 0,
        suspended: 0,
        reactivated: 0,
        deleted: 0
      };

      const userActivityMap = new Map<string, {
        action_count: number;
        last_action: string;
      }>();

      analytics.forEach((item: UserLicenseAnalytics) => {
        const date = new Date(item.action_date).toISOString().split('T')[0];
        
        // Daily stats
        if (!dailyStatsMap.has(date)) {
          dailyStatsMap.set(date, {
            created: 0,
            renewed: 0,
            suspended: 0,
            deleted: 0
          });
        }
        
        const dayStats = dailyStatsMap.get(date)!;
        if (item.action_type in dayStats) {
          const stats = dayStats as Record<string, number>;
          stats[item.action_type]++;
        }

        // Action summary
        actionSummary[item.action_type] = (actionSummary[item.action_type] || 0) + 1;

        // User activity
        if (item.user_email) {
          const userActivity = userActivityMap.get(item.user_email) || {
            action_count: 0,
            last_action: item.action_date
          };
          
          userActivity.action_count++;
          if (new Date(item.action_date) > new Date(userActivity.last_action)) {
            userActivity.last_action = item.action_date;
          }
          
          userActivityMap.set(item.user_email, userActivity);
        }
      });

      // Convert maps to arrays
      const daily_stats = Array.from(dailyStatsMap.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const user_activity = Array.from(userActivityMap.entries())
        .map(([user_email, activity]) => ({ user_email, ...activity }))
        .sort((a, b) => b.action_count - a.action_count)
        .slice(0, 10); // Top 10 most active users

      setData({
        daily_stats,
        action_summary,
        user_activity
      });
    } catch (err) {
      console.error('Error fetching aggregated analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch aggregated analytics');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAggregatedData();
  }, [fetchAggregatedData]);

  return {
    data,
    loading,
    error,
    refetch: fetchAggregatedData
  };
}