import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Users, DollarSign, MessageCircle, Phone, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';

interface ConversionStats {
  plan_id: string;
  plan_name: string;
  total_clicks: number;
  conversions: number;
  conversion_rate: number;
  avg_plan_price: number;
  date: string;
}

interface SalesSummary {
  plan_id: string;
  plan_name: string;
  total_sales: number;
  total_revenue: number;
  avg_sale_value: number;
  avg_discount: number;
  confirmed_sales: number;
  signed_contracts: number;
  avg_satisfaction: number;
  date: string;
}

interface AnalyticsData {
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  avgConversionRate: number;
  topPerformingPlan: string;
  recentActivity: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const WhatsAppAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const [conversionStats, setConversionStats] = useState<ConversionStats[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0,
    avgConversionRate: 0,
    topPerformingPlan: '',
    recentActivity: []
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const handleRefresh = () => {
    fetchAnalyticsData(true);
  };

  const getDateFilter = () => {
    const now = new Date();
    const days = parseInt(dateRange.replace('d', ''));
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return startDate.toISOString();
  };

  const fetchAnalyticsData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const startDate = getDateFilter();

      // Fetch conversion stats
      const { data: conversions, error: conversionError } = await supabase
        .from('whatsapp_conversion_stats')
        .select('*')
        .gte('date', startDate)
        .order('date', { ascending: false });

      if (conversionError) throw conversionError;

      // Fetch sales summary
      const { data: sales, error: salesError } = await supabase
        .from('whatsapp_sales_summary')
        .select('*')
        .gte('date', startDate)
        .order('date', { ascending: false });

      if (salesError) throw salesError;

      // Fetch recent conversions for activity feed
      const { data: recentConversions, error: recentError } = await supabase
        .from('whatsapp_conversions')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      setConversionStats(conversions || []);
      setSalesSummary(sales || []);

      // Calculate summary metrics
      const totalClicks = conversions?.reduce((sum, item) => sum + item.total_clicks, 0) || 0;
      const totalConversions = conversions?.reduce((sum, item) => sum + item.conversions, 0) || 0;
      const totalRevenue = sales?.reduce((sum, item) => sum + item.total_revenue, 0) || 0;
      const avgConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      
      const topPlan = sales?.reduce((prev, current) => 
        (prev.total_revenue > current.total_revenue) ? prev : current
      );

      setAnalyticsData({
        totalClicks,
        totalConversions,
        totalRevenue,
        avgConversionRate,
        topPerformingPlan: topPlan?.plan_name || 'N/A',
        recentActivity: recentConversions || []
      });

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Erro ao carregar dados de análise. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'converted': return 'text-green-600';
      case 'clicked': return 'text-blue-600';
      case 'abandoned': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'converted': return <CheckCircle className="w-4 h-4" />;
      case 'clicked': return <Clock className="w-4 h-4" />;
      case 'abandoned': return <AlertCircle className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Carregando análises...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
        <button 
          onClick={handleRefresh}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          disabled={refreshing}
        >
          {refreshing ? 'Tentando...' : 'Tentar Novamente'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Análises WhatsApp</h2>
        <div className="flex items-center space-x-4">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Cliques</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalClicks.toLocaleString()}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversões</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalConversions.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.avgConversionRate.toFixed(1)}%</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.totalRevenue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Rate Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Taxa de Conversão por Plano</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="plan_name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value, name) => [name === 'conversion_rate' ? `${value}%` : value, name]} />
              <Legend />
              <Bar dataKey="conversion_rate" fill="#3B82F6" name="Taxa de Conversão (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receita por Plano</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={salesSummary}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ plan_name, total_revenue }) => `${plan_name}: ${formatCurrency(total_revenue)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total_revenue"
              >
                {salesSummary.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Performance por Plano</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliques</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversões</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket Médio</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {conversionStats.map((stat, index) => {
                const salesData = salesSummary.find(s => s.plan_id === stat.plan_id);
                return (
                  <tr key={stat.plan_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stat.plan_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.total_clicks.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.conversions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        stat.conversion_rate >= 10 ? 'bg-green-100 text-green-800' :
                        stat.conversion_rate >= 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {stat.conversion_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(salesData?.total_revenue || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(salesData?.avg_sale_value || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Atividade Recente</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {analyticsData.recentActivity.length > 0 ? (
              analyticsData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className={`flex items-center ${getStatusColor(activity.status)}`}>
                    {getStatusIcon(activity.status)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.plan_name} - {formatCurrency(activity.plan_price)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.user_email || 'Usuário anônimo'} • {formatDate(activity.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      activity.status === 'converted' ? 'bg-green-100 text-green-800' :
                      activity.status === 'clicked' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {activity.status === 'converted' ? 'Convertido' :
                       activity.status === 'clicked' ? 'Clicou' : 'Abandonou'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma atividade recente encontrada</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppAnalytics;