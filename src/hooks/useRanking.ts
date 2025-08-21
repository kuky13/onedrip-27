import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RankingEntry {
  id: string;
  user_name: string;
  score: number;
  created_at: string;
}

export const useRanking = () => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch rankings
  const fetchRankings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .rpc('get_top_rankings');

      if (error) throw error;
      
      setRankings(data?.map((item: any) => ({
        id: item.user_id,
        user_id: item.user_id,
        user_name: item.user_name,
        score: item.total_value || 0,
        total_budgets: item.total_budgets,
        total_value: item.total_value,
        avg_budget_value: item.avg_budget_value,
        rank_position: item.rank_position,
        created_at: new Date().toISOString()
      })) || []);
    } catch (err) {
      console.error('Error fetching rankings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rankings');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit new score (now using authenticated user)
  const submitScore = async (score: number): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('ranking_invaders')
        .insert([
          {
            user_id: user.id,
            score: score
          }
        ]);

      if (error) throw error;
      
      // Refresh rankings after successful submission
      await fetchRankings();
    } catch (err) {
      console.error('Error submitting score:', err);
      throw err;
    }
  };

  // Set up real-time subscription for ranking updates
  useEffect(() => {
    fetchRankings();

    let debounceTimer: NodeJS.Timeout | null = null;
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('ranking-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ranking_invaders'
        },
        () => {
          // Clear previous timer
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          
          // Debounce fetch calls
          debounceTimer = setTimeout(() => {
            fetchRankings();
            debounceTimer = null;
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      // Clear debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      // Remove subscription properly
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    rankings,
    isLoading,
    error,
    submitScore,
    refetch: fetchRankings
  };
};