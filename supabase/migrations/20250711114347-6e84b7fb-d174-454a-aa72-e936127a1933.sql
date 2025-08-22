-- Add service_specification column to budgets table
ALTER TABLE public.budgets 
ADD COLUMN service_specification TEXT;