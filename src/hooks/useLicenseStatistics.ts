import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LicenseStatistics {
  total_licenses: number;
  active_licenses: number;
  expired_licenses: number;
  suspended_licenses: number;
  licenses_created_today: number;
  licenses_expiring_soon: number;
  total_users: number;
  users_with_licenses: number;
  expiring_this_month?: number;
  new_this_month?: number;
  renewed_this_month?: number;
  revenue_this_month?: number;
  average_license_duration?: number;
  top_license_types?: Array<{type: string; count: number}>;
  monthly_trends?: Array<{month: string; count: number}>;
}

interface LicenseStatisticsFilters {
  date_from?: string;
  date_to?: string;
  license_type?: string;
  status?: string;
}

interface UseLicenseStatisticsReturn {
  statistics: LicenseStatistics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

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

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar estatísticas básicas de licenças
      const { data, error: queryError } = await supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const totalLicenses = data?.length || 0;
      const activeLicenses = data?.filter(license => license.is_active).length || 0;
      const expiredLicenses = data?.filter(license => 
        license.expires_at && new Date(license.expires_at) < now
      ).length || 0;
      const licensesCreatedToday = data?.filter(license => 
        new Date(license.created_at) >= today
      ).length || 0;
      const licensesExpiringSoon = data?.filter(license => 
        license.expires_at && 
        new Date(license.expires_at) >= now && 
        new Date(license.expires_at) <= nextWeek
      ).length || 0;

      // Buscar usuários únicos com licenças
      const userIds = [...new Set(data?.map(license => license.user_id).filter(Boolean))];
      const usersWithLicenses = userIds.length;

      // Buscar total de usuários
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      const stats: LicenseStatistics = {
        total_licenses: totalLicenses,
        active_licenses: activeLicenses,
        expired_licenses: expiredLicenses,
        suspended_licenses: 0, // Não temos campo suspended ainda
        licenses_created_today: licensesCreatedToday,
        licenses_expiring_soon: licensesExpiringSoon,
        total_users: totalUsers || 0,
        users_with_licenses: usersWithLicenses
      };

      setStatistics(stats);
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
    expiringThisMonth: statistics.expiring_this_month || 0,
    newThisMonth: statistics.new_this_month || 0,
    renewedThisMonth: statistics.renewed_this_month || 0,
    revenueThisMonth: statistics.revenue_this_month || 0,
    averageLicenseDuration: statistics.average_license_duration || 0,
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
        .eq('is_active', true);

      if (expiringSoonError) throw expiringSoonError;

      // Get licenses that expired today
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const { data: expiredToday, error: expiredTodayError } = await supabase
        .from('licenses')
        .select('id')
        .gte('expires_at', startOfDay.toISOString())
        .lt('expires_at', endOfDay.toISOString())
        .eq('is_active', false);

      if (expiredTodayError) throw expiredTodayError;

      // Get licenses that expired this week
      const { data: expiredThisWeek, error: expiredThisWeekError } = await supabase
        .from('licenses')
        .select('id')
        .gte('expires_at', lastWeek.toISOString())
        .lt('expires_at', today.toISOString())
        .eq('is_active', false);

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

      // Simulação de dados de receita, já que a tabela licenses não tem campo price
      const currentTotal = Math.random() * 10000;
      const previousTotal = Math.random() * 8000;
      const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

      // Generate mock breakdown data
      const breakdown = [];
      for (let i = 11; i >= 0; i--) {
        const amount = Math.random() * 1000;
        const periodLabel = new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000)
          .toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        breakdown.push({ period: periodLabel, amount });
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