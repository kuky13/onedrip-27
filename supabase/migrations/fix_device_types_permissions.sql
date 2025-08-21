-- Fix device_types table permissions
-- Ensure anon and authenticated users can read device types

-- Grant SELECT permission to anon role for device_types
GRANT SELECT ON public.device_types TO anon;

-- Grant SELECT permission to authenticated role for device_types
GRANT SELECT ON public.device_types TO authenticated;

-- Check if RLS policies exist and create if needed
DO $$ 
BEGIN
    -- Create RLS policy for device_types if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'device_types' 
        AND policyname = 'device_types_select_policy'
    ) THEN
        CREATE POLICY "device_types_select_policy" ON public.device_types
            FOR SELECT USING (true);
    END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.device_types ENABLE ROW LEVEL SECURITY;