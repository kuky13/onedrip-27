-- Enhanced User License Management System
-- This migration creates the database schema for integrated user and license management

-- Create user_license_analytics table for tracking license usage and analytics
CREATE TABLE IF NOT EXISTS public.user_license_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    license_id UUID,
    action_type TEXT NOT NULL CHECK (action_type IN ('created', 'renewed', 'suspended', 'reactivated', 'deleted')),
    action_date TIMESTAMPTZ DEFAULT NOW(),
    performed_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_license_bulk_operations table for tracking bulk operations
CREATE TABLE IF NOT EXISTS public.user_license_bulk_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('bulk_create', 'bulk_renew', 'bulk_suspend', 'bulk_delete')),
    user_ids UUID[] NOT NULL,
    license_data JSONB DEFAULT '{}',
    performed_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    results JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_license_analytics_user_id ON public.user_license_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_license_analytics_action_date ON public.user_license_analytics(action_date);
CREATE INDEX IF NOT EXISTS idx_user_license_bulk_operations_status ON public.user_license_bulk_operations(status);
CREATE INDEX IF NOT EXISTS idx_user_license_bulk_operations_created_at ON public.user_license_bulk_operations(created_at);

-- Function to get enhanced user list with license information
CREATE OR REPLACE FUNCTION public.admin_get_enhanced_users(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_search TEXT DEFAULT NULL,
    p_license_status TEXT DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'created_at',
    p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    phone TEXT,
    user_metadata JSONB,
    license_count BIGINT,
    active_licenses BIGINT,
    total_license_value NUMERIC,
    last_license_activity TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.created_at,
        u.last_sign_in_at,
        u.email_confirmed_at,
        u.phone,
        u.raw_user_meta_data as user_metadata,
        COALESCE(l.license_count, 0) as license_count,
        COALESCE(l.active_licenses, 0) as active_licenses,
        COALESCE(l.total_value, 0) as total_license_value,
        l.last_activity as last_license_activity
    FROM auth.users u
    LEFT JOIN (
        SELECT 
            user_id,
            COUNT(*) as license_count,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_licenses,
            SUM(COALESCE((metadata->>'value')::NUMERIC, 0)) as total_value,
            MAX(updated_at) as last_activity
        FROM public.licenses
        GROUP BY user_id
    ) l ON u.id = l.user_id
    WHERE 
        (p_search IS NULL OR 
         u.email ILIKE '%' || p_search || '%' OR 
         (u.raw_user_meta_data->>'name') ILIKE '%' || p_search || '%')
        AND (p_license_status IS NULL OR 
             (p_license_status = 'active' AND l.active_licenses > 0) OR
             (p_license_status = 'inactive' AND COALESCE(l.active_licenses, 0) = 0) OR
             (p_license_status = 'expired' AND l.license_count > 0 AND l.active_licenses = 0))
    ORDER BY 
        CASE 
            WHEN p_sort_by = 'email' AND p_sort_order = 'asc' THEN u.email
            WHEN p_sort_by = 'email' AND p_sort_order = 'desc' THEN u.email
        END ASC NULLS LAST,
        CASE 
            WHEN p_sort_by = 'email' AND p_sort_order = 'desc' THEN u.email
        END DESC NULLS LAST,
        CASE 
            WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN u.created_at
            WHEN p_sort_by = 'license_count' AND p_sort_order = 'asc' THEN l.license_count
        END ASC NULLS LAST,
        CASE 
            WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN u.created_at
            WHEN p_sort_by = 'license_count' AND p_sort_order = 'desc' THEN l.license_count
        END DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to get user license analytics
CREATE OR REPLACE FUNCTION public.admin_get_user_license_analytics(
    p_user_id UUID DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_email TEXT,
    license_id UUID,
    action_type TEXT,
    action_date TIMESTAMPTZ,
    performed_by UUID,
    performer_email TEXT,
    metadata JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        u.email as user_email,
        a.license_id,
        a.action_type,
        a.action_date,
        a.performed_by,
        p.email as performer_email,
        a.metadata
    FROM public.user_license_analytics a
    LEFT JOIN auth.users u ON a.user_id = u.id
    LEFT JOIN auth.users p ON a.performed_by = p.id
    WHERE 
        (p_user_id IS NULL OR a.user_id = p_user_id)
        AND (p_start_date IS NULL OR a.action_date >= p_start_date)
        AND (p_end_date IS NULL OR a.action_date <= p_end_date)
    ORDER BY a.action_date DESC
    LIMIT p_limit;
END;
$$;

-- Function to perform bulk license operations
CREATE OR REPLACE FUNCTION public.admin_bulk_license_operation(
    p_operation_type TEXT,
    p_user_ids UUID[],
    p_license_data JSONB DEFAULT '{}'
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_operation_id UUID;
    v_user_id UUID;
    v_license_id UUID;
    v_success_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_errors JSONB := '[]';
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    -- Create bulk operation record
    INSERT INTO public.user_license_bulk_operations (
        operation_type,
        user_ids,
        license_data,
        performed_by,
        status
    ) VALUES (
        p_operation_type,
        p_user_ids,
        p_license_data,
        auth.uid(),
        'processing'
    ) RETURNING id INTO v_operation_id;

    -- Process each user
    FOREACH v_user_id IN ARRAY p_user_ids
    LOOP
        BEGIN
            CASE p_operation_type
                WHEN 'bulk_create' THEN
                    -- Create new license
                    INSERT INTO public.licenses (
                        user_id,
                        type,
                        status,
                        expires_at,
                        metadata
                    ) VALUES (
                        v_user_id,
                        COALESCE(p_license_data->>'type', 'standard'),
                        'active',
                        (NOW() + INTERVAL '1 year'),
                        p_license_data
                    ) RETURNING id INTO v_license_id;
                    
                WHEN 'bulk_renew' THEN
                    -- Renew existing licenses
                    UPDATE public.licenses 
                    SET 
                        expires_at = expires_at + INTERVAL '1 year',
                        updated_at = NOW()
                    WHERE user_id = v_user_id AND status = 'active';
                    
                WHEN 'bulk_suspend' THEN
                    -- Suspend licenses
                    UPDATE public.licenses 
                    SET 
                        status = 'suspended',
                        updated_at = NOW()
                    WHERE user_id = v_user_id AND status = 'active';
                    
                WHEN 'bulk_delete' THEN
                    -- Delete licenses
                    DELETE FROM public.licenses 
                    WHERE user_id = v_user_id;
            END CASE;
            
            -- Log the action
            INSERT INTO public.user_license_analytics (
                user_id,
                license_id,
                action_type,
                performed_by,
                metadata
            ) VALUES (
                v_user_id,
                v_license_id,
                p_operation_type,
                auth.uid(),
                p_license_data
            );
            
            v_success_count := v_success_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
            v_errors := v_errors || jsonb_build_object(
                'user_id', v_user_id,
                'error', SQLERRM
            );
        END;
    END LOOP;

    -- Update operation status
    UPDATE public.user_license_bulk_operations 
    SET 
        status = 'completed',
        completed_at = NOW(),
        results = jsonb_build_object(
            'success_count', v_success_count,
            'error_count', v_error_count,
            'errors', v_errors
        )
    WHERE id = v_operation_id;

    RETURN v_operation_id;
END;
$$;

-- Function to get license statistics for dashboard
CREATE OR REPLACE FUNCTION public.admin_get_license_statistics()
RETURNS TABLE (
    total_users BIGINT,
    users_with_licenses BIGINT,
    total_licenses BIGINT,
    active_licenses BIGINT,
    expired_licenses BIGINT,
    suspended_licenses BIGINT,
    licenses_created_today BIGINT,
    licenses_expiring_soon BIGINT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM auth.users) as total_users,
        (SELECT COUNT(DISTINCT user_id) FROM public.licenses) as users_with_licenses,
        (SELECT COUNT(*) FROM public.licenses) as total_licenses,
        (SELECT COUNT(*) FROM public.licenses WHERE status = 'active') as active_licenses,
        (SELECT COUNT(*) FROM public.licenses WHERE status = 'expired') as expired_licenses,
        (SELECT COUNT(*) FROM public.licenses WHERE status = 'suspended') as suspended_licenses,
        (SELECT COUNT(*) FROM public.licenses WHERE DATE(created_at) = CURRENT_DATE) as licenses_created_today,
        (SELECT COUNT(*) FROM public.licenses WHERE status = 'active' AND expires_at <= NOW() + INTERVAL '30 days') as licenses_expiring_soon;
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.user_license_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_license_bulk_operations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin can view all analytics" ON public.user_license_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admin can view all bulk operations" ON public.user_license_bulk_operations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON public.user_license_analytics TO authenticated;
GRANT ALL ON public.user_license_bulk_operations TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_enhanced_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_license_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_license_operation TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_license_statistics TO authenticated;