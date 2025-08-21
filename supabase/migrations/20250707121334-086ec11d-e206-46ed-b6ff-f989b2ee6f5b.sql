-- Create function to get top rankings with unique usernames (highest score only)
CREATE OR REPLACE FUNCTION public.get_top_rankings()
RETURNS TABLE(
  id uuid,
  user_name text,
  score integer,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  WITH ranked_scores AS (
    SELECT 
      ri.id,
      ri.user_name,
      ri.score,
      ri.created_at,
      ROW_NUMBER() OVER (PARTITION BY ri.user_name ORDER BY ri.score DESC, ri.created_at ASC) as rn
    FROM public.ranking_invaders ri
  )
  SELECT 
    ranked_scores.id,
    ranked_scores.user_name,
    ranked_scores.score,
    ranked_scores.created_at
  FROM ranked_scores
  WHERE rn = 1
  ORDER BY score DESC, created_at ASC
  LIMIT 10;
$$;