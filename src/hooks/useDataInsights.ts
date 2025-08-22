import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

interface DataInsightOptions {
  userId: string;
  dateRange: number;
  minSampleSize?: number;
}

interface InsightMetadata {
  totalBudgets: number;
  averageValue: number;
  conversionRate: number;
  totalRevenue: number;
  deviceDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
}

interface DuplicateBudget {
  id: string;
  device_model: string;
  device_type: string;
  client_name?: string;
  total_price: number;
  created_at: string;
  duplicateOf: string[];
}

export const useDataInsights = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  const generateInsights = useCallback(async (options: DataInsightOptions) => {
    const { userId, dateRange, minSampleSize = 5 } = options;
    
    setIsAnalyzing(true);
    
    try {
      const startDate = subDays(new Date(), dateRange);
      
      const { data: budgets, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('owner_id', userId)
        .is('deleted_at', null)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!budgets || budgets.length < minSampleSize) {
        return {
          insights: [],
          metadata: null,
          duplicates: [],
          suggestions: ['Crie mais orçamentos para obter insights mais precisos']
        };
      }

      // Calcular métricas básicas
      const totalBudgets = budgets.length;
      const totalValue = budgets.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
      const averageValue = totalValue / totalBudgets / 100;
      
      const paidBudgets = budgets.filter(b => b.is_paid);
      const totalRevenue = paidBudgets.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0) / 100;
      
      const approvedBudgets = budgets.filter(b => b.workflow_status === 'approved' || b.workflow_status === 'completed');
      const conversionRate = (approvedBudgets.length / totalBudgets) * 100;

      // Distribuição de dispositivos
      const deviceDistribution = budgets.reduce((acc, budget) => {
        const device = budget.device_type || 'Outros';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Distribuição de status
      const statusDistribution = budgets.reduce((acc, budget) => {
        const status = budget.workflow_status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Detectar duplicatas potenciais
      const duplicates = findDuplicateBudgets(budgets);

      // Gerar insights automatizados
      const insights = [];
      const suggestions = [];

      // Insight de conversão
      if (conversionRate < 50) {
        insights.push({
          type: 'warning',
          title: 'Taxa de Conversão Baixa',
          description: `Apenas ${conversionRate.toFixed(1)}% dos orçamentos são aprovados`,
          priority: 'high',
          suggestion: 'Revise sua estratégia de precificação ou melhore o acompanhamento dos clientes'
        });
      } else if (conversionRate > 80) {
        insights.push({
          type: 'opportunity',
          title: 'Excelente Taxa de Conversão',
          description: `${conversionRate.toFixed(1)}% dos orçamentos são aprovados`,
          priority: 'medium',
          suggestion: 'Continue com as práticas atuais e considere aumentar ligeiramente os preços'
        });
      }

      // Insight de dispositivo popular
      const mostPopularDevice = Object.entries(deviceDistribution)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (mostPopularDevice && mostPopularDevice[1] > totalBudgets * 0.4) {
        insights.push({
          type: 'trend',
          title: `${mostPopularDevice[0]} Dominante`,
          description: `${Math.round((mostPopularDevice[1] / totalBudgets) * 100)}% dos orçamentos`,
          priority: 'medium',
          suggestion: 'Foque em otimizar estoque e especialização neste tipo de dispositivo'
        });
      }

      // Insight de faturamento
      if (totalRevenue > 0) {
        const avgTicket = totalRevenue / paidBudgets.length;
        insights.push({
          type: 'trend',
          title: 'Ticket Médio',
          description: `R$ ${avgTicket.toFixed(2)} por serviço pago`,
          priority: 'low',
          suggestion: avgTicket < 200 ? 'Considere serviços adicionais para aumentar o ticket médio' : 'Ticket médio está bom'
        });
      }

      // Sugestões de duplicatas
      if (duplicates.length > 0) {
        suggestions.push(`${duplicates.length} possíveis orçamentos duplicados encontrados`);
        insights.push({
          type: 'warning',
          title: 'Orçamentos Duplicados',
          description: `${duplicates.length} orçamentos podem ser duplicatas`,
          priority: 'medium',
          suggestion: 'Revise e remova orçamentos duplicados para manter dados limpos'
        });
      }

      const metadata: InsightMetadata = {
        totalBudgets,
        averageValue,
        conversionRate,
        totalRevenue,
        deviceDistribution,
        statusDistribution
      };

      setLastAnalysis(new Date());
      
      return {
        insights,
        metadata,
        duplicates,
        suggestions
      };

    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      throw new Error('Falha na análise de dados');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    generateInsights,
    isAnalyzing,
    lastAnalysis
  };
};

// Função para detectar duplicatas
function findDuplicateBudgets(budgets: any[]): DuplicateBudget[] {
  const duplicates: DuplicateBudget[] = [];
  const seen = new Map<string, any[]>();

  budgets.forEach(budget => {
    const key = `${budget.device_type}-${budget.device_model}-${budget.client_name || 'no-client'}`;
    
    if (!seen.has(key)) {
      seen.set(key, []);
    }
    seen.get(key)!.push(budget);
  });

  seen.forEach((budgetGroup) => {
    if (budgetGroup.length > 1) {
      // Ordenar por data de criação
      budgetGroup.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      // O primeiro é o original, os outros são duplicatas
      for (let i = 1; i < budgetGroup.length; i++) {
        const duplicate = budgetGroup[i];
        duplicates.push({
          id: duplicate.id,
          device_model: duplicate.device_model,
          device_type: duplicate.device_type,
          client_name: duplicate.client_name,
          total_price: duplicate.total_price,
          created_at: duplicate.created_at,
          duplicateOf: [budgetGroup[0].id]
        });
      }
    }
  });

  return duplicates;
}