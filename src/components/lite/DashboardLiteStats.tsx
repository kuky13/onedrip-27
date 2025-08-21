import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardLiteStatsProps {
  profile: any;
  userId?: string;
}

export const DashboardLiteStats = ({ profile, userId }: DashboardLiteStatsProps) => {
  const [weeklyGrowth, setWeeklyGrowth] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchWeeklyGrowth = async () => {
      try {
        setLoading(true);
        
        const today = new Date();
        const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const { error, count } = await supabase
          .from('budgets')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', userId)
          .gte('created_at', weekStart.toISOString());

        if (!error) {
          setWeeklyGrowth(count || 0);
        }
      } catch (error) {
        console.error('Error fetching weekly growth:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyGrowth();
  }, [userId]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="bg-card border rounded-lg p-4 mb-4">
      <div className="mb-3">
        <h2 className="text-xl font-bold text-foreground">
          {getGreeting()}, {profile?.name || 'usuário'}!
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-muted-foreground">
            Seja bem-vindo(a) de volta!
          </p>
          {profile && (
            <span className="bg-primary/20 text-primary text-xs font-semibold py-1 px-2 rounded-full">
              {profile.role.toUpperCase()}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        <span className="text-sm font-medium text-foreground">
          {loading ? 'Carregando...' : `${weeklyGrowth} orçamentos esta semana`}
        </span>
      </div>
    </div>
  );
};