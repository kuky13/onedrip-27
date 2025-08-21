-- Create table for the Debugging Invaders game ranking
CREATE TABLE public.ranking_invaders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ranking_invaders ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since it's an easter egg)
CREATE POLICY "Anyone can view rankings" 
ON public.ranking_invaders 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert rankings" 
ON public.ranking_invaders 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance on score ordering
CREATE INDEX idx_ranking_invaders_score ON public.ranking_invaders(score DESC, created_at DESC);