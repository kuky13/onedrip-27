-- Modificar tabela ranking_invaders para usar usuários autenticados
-- Primeiro, vamos dropar a tabela existente e recriar com a estrutura correta
DROP TABLE IF EXISTS public.ranking_invaders;

-- Criar nova tabela ranking_invaders ligada aos usuários autenticados
CREATE TABLE public.ranking_invaders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, score) -- Permite múltiplas pontuações por usuário, mas não duplicatas exatas
);

-- Enable Row Level Security
ALTER TABLE public.ranking_invaders ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para ranking_invaders
CREATE POLICY "Authenticated users can view rankings" 
ON public.ranking_invaders 
FOR SELECT 
USING (true); -- Todos podem ver o ranking

CREATE POLICY "Authenticated users can insert their own scores" 
ON public.ranking_invaders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas suas próprias pontuações
CREATE POLICY "Users can update their own scores" 
ON public.ranking_invaders 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Usuários podem deletar apenas suas próprias pontuações
CREATE POLICY "Users can delete their own scores" 
ON public.ranking_invaders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar índice para melhor performance no ranking
CREATE INDEX idx_ranking_invaders_score_user ON public.ranking_invaders(score DESC, created_at ASC, user_id);

-- Atualizar função get_top_rankings para usar user_profiles
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
      up.name as user_name,
      ri.score,
      ri.created_at,
      ROW_NUMBER() OVER (PARTITION BY ri.user_id ORDER BY ri.score DESC, ri.created_at ASC) as rn
    FROM public.ranking_invaders ri
    INNER JOIN public.user_profiles up ON ri.user_id = up.id
    WHERE up.is_active = true
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