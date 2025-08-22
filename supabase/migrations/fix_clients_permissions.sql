-- Fix clients table permissions
-- Ensure authenticated users can access their own clients

-- Grant permissions to authenticated role for clients
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;

-- Check if RLS policies exist and create if needed
DO $$ 
BEGIN
    -- Create RLS policy for clients SELECT if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clients' 
        AND policyname = 'clients_select_policy'
    ) THEN
        CREATE POLICY "clients_select_policy" ON public.clients
            FOR SELECT USING (
                user_id = auth.uid() OR 
                public.is_current_user_admin()
            );
    END IF;

    -- Create RLS policy for clients INSERT if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clients' 
        AND policyname = 'clients_insert_policy'
    ) THEN
        CREATE POLICY "clients_insert_policy" ON public.clients
            FOR INSERT WITH CHECK (
                user_id = auth.uid()
            );
    END IF;

    -- Create RLS policy for clients UPDATE if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clients' 
        AND policyname = 'clients_update_policy'
    ) THEN
        CREATE POLICY "clients_update_policy" ON public.clients
            FOR UPDATE USING (
                user_id = auth.uid() OR 
                public.is_current_user_admin()
            );
    END IF;

    -- Create RLS policy for clients DELETE if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clients' 
        AND policyname = 'clients_delete_policy'
    ) THEN
        CREATE POLICY "clients_delete_policy" ON public.clients
            FOR DELETE USING (
                user_id = auth.uid() OR 
                public.is_current_user_admin()
            );
    END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;