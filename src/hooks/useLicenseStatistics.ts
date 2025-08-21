import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  LicenseStatistics,
  UseLicenseStatisticsReturn,
  LicenseStatisticsFilters
} from '../types/userLicense';

interface UseLicenseStatisticsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  filters?: LicenseStatisticsFilters;
}

export function useLicenseStatistics(options: UseLicenseStatisticsOptions = {}): UseLicenseStatisticsReturn {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    filters = {}
  } = options;

  const [statistics, setStatistics] = useState<LicenseStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('admin_get_license_statistics', {
        p_date_from: filters.dateFrom || null,
        p_date_to: filters.dateTo || null,
        p_license_type: filters.licenseType || null,
        p_status: filters.status || null
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setStatistics(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching license statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refresh = useCallback(() => {
    return fetchStatistics();
  }, [fetchStatistics]);

  // Initial fetch
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchStatistics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    lastUpdated,
    refresh
  };
}

// Hook for real-time license metrics
export function useLicenseMetrics() {
  const { statistics, loading, error, refresh } = useLicenseStatistics({
    autoRefresh: true,
    refreshInterval: 15000 // 15 seconds for more frequent updates
  });

  const metrics = statistics ? {
    totalLicenses: statistics.total_licenses,
    activeLicenses: statistics.active_licenses,
    expiredLicenses: statistics.expired_licenses,
    suspendedLicenses: statistics.suspended_licenses,
    expiringThisMonth: statistics.expiring_this_month,
    newThisMonth: statistics.new_this_month,
    renewedThisMonth: statistics.renewed_this_month,
    revenueThisMonth: statistics.revenue_this_month,
    averageLicenseDuration: statistics.average_license_duration,
    topLicenseTypes: statistics.top_license_types || [],
    monthlyTrends: statistics.monthly_trends || []
  } : null;

  return {
    metrics,
    loading,
    error,
    refresh
  };
}

// Hook for license expiration alerts
export function useLicenseExpirationAlerts() {
  const [alerts, setAlerts] = useState<{
    expiringSoon: number;
    expiredToday: number;
    expiredThisWeek: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get licenses expiring in the next 7 days
      const { data: expiringSoon, error: expiringSoonError } = await supabase
        .from('licenses')
        .select('id')
        .gte('expires_at', today.toISOString())
        .lte('expires_at', nextWeek.toISOString())
        .eq('status', 'active');

      if (expiringSoonError) throw expiringSoonError;

      // Get licenses that expired today
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const { data: expiredToday, error: expiredTodayError } = await supabase
        .from('licenses')
        .select('id')
        .gte('expires_at', startOfDay.toISOString())
        .lt('expires_at', endOfDay.toISOString())
        .eq('status', 'expired');

      if (expiredTodayError) throw expiredTodayError;

      // Get licenses that expired this week
      const { data: expiredThisWeek, error: expiredThisWeekError } = await supabase
        .from('licenses')
        .select('id')
        .gte('expires_at', lastWeek.toISOString())
        .lt('expires_at', today.toISOString())
        .eq('status', 'expired');

      if (expiredThisWeekError) throw expiredThisWeekError;

      setAlerts({
        expiringSoon: expiringSoon?.length || 0,
        expiredToday: expiredToday?.length || 0,
        expiredThisWeek: expiredThisWeek?.length || 0
      });
    } catch (err) {
      console.error('Error fetching license alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    refresh: fetchAlerts
  };
}

// Hook for license revenue tracking
export function useLicenseRevenue(period: 'month' | 'quarter' | 'year' = 'month') {
  const [revenue, setRevenue] = useState<{
    current: number;
    previous: number;
    growth: number;
    breakdown: Array<{ period: string; amount: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      let currentStart: Date;
      let previousStart: Date;
      let previousEnd: Date;

      switch (period) {
        case 'month': {
          currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
          previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        }
        case 'quarter': {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          currentStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
          previousStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
          previousEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
          break;
        }
        case 'year': {
          currentStart = new Date(now.getFullYear(), 0, 1);
          previousStart = new Date(now.getFullYear() - 1, 0, 1);
          previousEnd = new Date(now.getFullYear() - 1, 11, 31);
          break;
        }
      }

      // Get current period revenue
      const { data: currentRevenue, error: currentError } = await supabase
        .from('licenses')
        .select('price')
        .gte('created_at', currentStart.toISOString())
        .lte('created_at', now.toISOString());

      if (currentError) throw currentError;

      // Get previous period revenue
      const { data: previousRevenue, error: previousError } = await supabase
        .from('licenses')
        .select('price')
        .gte('created_at', previousStart.toISOString())
        .lte('created_at', previousEnd.toISOString());

      if (previousError) throw previousError;

      const currentTotal = currentRevenue?.reduce((sum, license) => sum + (license.price || 0), 0) || 0;
      const previousTotal = previousRevenue?.reduce((sum, license) => sum + (license.price || 0), 0) || 0;
      const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

      // Get breakdown data (last 12 periods)
      const breakdown = [];
      for (let i = 11; i >= 0; i--) {
        let periodStart: Date;
        let periodEnd: Date;
        let periodLabel: string;

        switch (period) {
          case 'month': {
            periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            periodLabel = periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            break;
          }
          case 'quarter': {
            const quarterStart = Math.floor(now.getMonth() / 3) - i;
            const year = now.getFullYear() + Math.floor(quarterStart / 4);
            const quarter = ((quarterStart % 4) + 4) % 4;
            periodStart = new Date(year, quarter * 3, 1);
            periodEnd = new Date(year, quarter * 3 + 3, 0);
            periodLabel = `Q${quarter + 1} ${year}`;
            break;
          }
          case 'year': {
            periodStart = new Date(now.getFullYear() - i, 0, 1);
            periodEnd = new Date(now.getFullYear() - i, 11, 31);
            periodLabel = (now.getFullYear() - i).toString();
            break;
          }
        }

        const { data: periodRevenue } = await supabase
          .from('licenses')
          .select('price')
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString());

        const periodTotal = periodRevenue?.reduce((sum, license) => sum + (license.price || 0), 0) || 0;
        breakdown.push({ period: periodLabel, amount: periodTotal });
      }

      setRevenue({
        current: currentTotal,
        previous: previousTotal,
        growth,
        breakdown
      });
    } catch (err) {
      console.error('Error fetching license revenue:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch revenue');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  return {
    revenue,
    loading,
    error,
    refresh: fetchRevenue
  };
}