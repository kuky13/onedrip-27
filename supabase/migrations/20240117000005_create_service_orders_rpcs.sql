-- Migration: Create Service Orders RPCs
-- Date: 2024-01-17
-- Description: Remote Procedure Calls for optimized service orders operations

-- RPC: Search service orders with advanced filtering
CREATE OR REPLACE FUNCTION search_service_orders(
    p_search_query TEXT DEFAULT NULL,
    p_status service_order_status DEFAULT NULL,
    p_priority service_order_priority DEFAULT NULL,
    p_device_type_id UUID DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    order_number VARCHAR,
    client_name VARCHAR,
    client_phone VARCHAR,
    device_model VARCHAR,
    status service_order_status,
    priority service_order_priority,
    total_price DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE,
    delivery_date DATE,
    search_rank REAL
)
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has access to service orders beta
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND (service_orders_beta_enabled = true OR role = 'admin')
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Módulo Service Orders (Beta) não habilitado';
    END IF;

    RETURN QUERY
    SELECT 
        so.id,
        so.order_number,
        c.name as client_name,
        c.phone as client_phone,
        so.device_model,
        so.status,
        so.priority,
        so.total_price,
        so.created_at,
        so.delivery_date,
        CASE 
            WHEN p_search_query IS NOT NULL THEN
                ts_rank(so.search_vector, plainto_tsquery('portuguese', p_search_query))
            ELSE 1.0
        END as search_rank
    FROM service_orders so
    LEFT JOIN clients c ON so.client_id = c.id
    WHERE 
        so.deleted_at IS NULL
        AND ((so.owner_id = auth.uid()) OR public.is_current_user_admin())
        AND (p_search_query IS NULL OR so.search_vector @@ plainto_tsquery('portuguese', p_search_query))
        AND (p_status IS NULL OR so.status = p_status)
        AND (p_priority IS NULL OR so.priority = p_priority)
        AND (p_device_type_id IS NULL OR so.device_type_id = p_device_type_id)
        AND (p_date_from IS NULL OR so.created_at::date >= p_date_from)
        AND (p_date_to IS NULL OR so.created_at::date <= p_date_to)
    ORDER BY 
        CASE WHEN p_search_query IS NOT NULL THEN search_rank END DESC,
        so.priority DESC,
        so.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- RPC: Get service order statistics for dashboard
CREATE OR REPLACE FUNCTION get_service_orders_stats(
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    total_orders INTEGER,
    pending_orders INTEGER,
    in_progress_orders INTEGER,
    completed_orders INTEGER,
    cancelled_orders INTEGER,
    total_revenue DECIMAL,
    avg_completion_time INTERVAL,
    high_priority_orders INTEGER
)
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has access to service orders beta
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND (service_orders_beta_enabled = true OR role = 'admin')
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Módulo Service Orders (Beta) não habilitado';
    END IF;

    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_orders,
        COUNT(CASE WHEN status = 'opened' THEN 1 END)::INTEGER as pending_orders,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END)::INTEGER as in_progress_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::INTEGER as completed_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END)::INTEGER as cancelled_orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_price END), 0) as total_revenue,
        NULL::INTERVAL as avg_completion_time,
        COUNT(CASE WHEN priority = 'high' AND status != 'completed' THEN 1 END)::INTEGER as high_priority_orders
    FROM service_orders
    WHERE 
        deleted_at IS NULL
        AND ((owner_id = auth.uid()) OR public.is_current_user_admin())
        AND (p_date_from IS NULL OR created_at::date >= p_date_from)
        AND (p_date_to IS NULL OR created_at::date <= p_date_to);
END;
$$ LANGUAGE plpgsql;

-- RPC: Soft delete service order
CREATE OR REPLACE FUNCTION soft_delete_service_order(
    p_service_order_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
    v_owner_id UUID;
BEGIN
    -- Check if user has access to service orders beta
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND (service_orders_beta_enabled = true OR role = 'admin')
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Módulo Service Orders (Beta) não habilitado';
    END IF;

    -- Get the owner of the service order
    SELECT owner_id INTO v_owner_id
    FROM service_orders
    WHERE id = p_service_order_id AND deleted_at IS NULL;

    -- Check if service order exists
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Ordem de serviço não encontrada ou já foi excluída';
    END IF;

    -- Check permissions
    IF v_owner_id != auth.uid() AND NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Permissão negada: Você não pode excluir esta ordem de serviço';
    END IF;

    -- Perform soft delete
    UPDATE service_orders
    SET 
        deleted_at = NOW(),
        deleted_by = auth.uid()
    WHERE id = p_service_order_id;

    -- Log the deletion event
    INSERT INTO service_order_events (service_order_id, event_type, payload)
    VALUES (
        p_service_order_id,
        'order_deleted',
        jsonb_build_object(
            'deleted_at', NOW(),
            'deleted_by', auth.uid(),
            'reason', 'soft_delete_via_rpc'
        )
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RPC: Restore soft deleted service order
CREATE OR REPLACE FUNCTION restore_service_order(
    p_service_order_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
    v_owner_id UUID;
BEGIN
    -- Check if user is admin (only admins can restore)
    IF NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Permissão negada: Apenas administradores podem restaurar ordens de serviço';
    END IF;

    -- Get the owner of the service order
    SELECT owner_id INTO v_owner_id
    FROM service_orders
    WHERE id = p_service_order_id AND deleted_at IS NOT NULL;

    -- Check if service order exists and is deleted
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Ordem de serviço não encontrada ou não está excluída';
    END IF;

    -- Restore the service order
    UPDATE service_orders
    SET 
        deleted_at = NULL,
        deleted_by = NULL
    WHERE id = p_service_order_id;

    -- Log the restoration event
    INSERT INTO service_order_events (service_order_id, event_type, payload)
    VALUES (
        p_service_order_id,
        'order_restored',
        jsonb_build_object(
            'restored_at', NOW(),
            'restored_by', auth.uid()
        )
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RPC: Get service order with full details (items, events, attachments)
CREATE OR REPLACE FUNCTION get_service_order_details(
    p_service_order_id UUID
)
RETURNS TABLE (
    -- Service Order fields
    id UUID,
    client_id UUID,
    client_name VARCHAR,
    client_phone VARCHAR,
    client_address TEXT,
    device_type VARCHAR,
    device_model VARCHAR,
    imei_serial VARCHAR,
    reported_issue TEXT,
    status VARCHAR,
    priority VARCHAR,
    parts_cost DECIMAL,
    labor_cost DECIMAL,
    total_price DECIMAL,
    is_paid BOOLEAN,
    delivery_date TIMESTAMP WITH TIME ZONE,
    warranty_months INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    -- Aggregated data
    items_count INTEGER,
    events_count INTEGER,
    attachments_count INTEGER
)
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has access to service orders beta
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND (service_orders_beta_enabled = true OR role = 'admin')
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Módulo Service Orders (Beta) não habilitado';
    END IF;

    RETURN QUERY
    SELECT 
        so.id,
        so.client_id,
        c.name as client_name,
        c.phone as client_phone,
        c.address as client_address,
        so.device_type,
        so.device_model,
        so.imei_serial,
        so.reported_issue,
        so.status,
        so.priority,
        so.parts_cost,
        so.labor_cost,
        so.total_price,
        so.is_paid,
        so.delivery_date,
        so.warranty_months,
        so.notes,
        so.created_at,
        so.updated_at,
        COALESCE(items.count, 0)::INTEGER as items_count,
        COALESCE(events.count, 0)::INTEGER as events_count,
        COALESCE(attachments.count, 0)::INTEGER as attachments_count
    FROM service_orders so
    LEFT JOIN clients c ON so.client_id = c.id
    LEFT JOIN (
        SELECT service_order_id, COUNT(*) as count
        FROM service_order_items
        WHERE deleted_at IS NULL
        GROUP BY service_order_id
    ) items ON so.id = items.service_order_id
    LEFT JOIN (
        SELECT service_order_id, COUNT(*) as count
        FROM service_order_events
        GROUP BY service_order_id
    ) events ON so.id = events.service_order_id
    LEFT JOIN (
        SELECT service_order_id, COUNT(*) as count
        FROM service_order_attachments
        GROUP BY service_order_id
    ) attachments ON so.id = attachments.service_order_id
    WHERE 
        so.id = p_service_order_id
        AND so.deleted_at IS NULL
        AND ((so.owner_id = auth.uid()) OR public.is_current_user_admin());
END;
$$ LANGUAGE plpgsql;

-- RPC: Update service order status with automatic event logging
CREATE OR REPLACE FUNCTION update_service_order_status(
    p_service_order_id UUID,
    p_new_status service_order_status,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
    v_owner_id UUID;
    v_current_status service_order_status;
BEGIN
    -- Check if user has access to service orders beta
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND (service_orders_beta_enabled = true OR role = 'admin')
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Módulo Service Orders (Beta) não habilitado';
    END IF;

    -- Get current status and owner
    SELECT owner_id, status INTO v_owner_id, v_current_status
    FROM service_orders
    WHERE id = p_service_order_id AND deleted_at IS NULL;

    -- Check if service order exists
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Ordem de serviço não encontrada';
    END IF;

    -- Check permissions
    IF v_owner_id != auth.uid() AND NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Permissão negada: Você não pode alterar esta ordem de serviço';
    END IF;

    -- Don't update if status is the same
    IF v_current_status = p_new_status THEN
        RETURN TRUE;
    END IF;

    -- Update the status
    UPDATE service_orders
    SET 
        status = p_new_status,
        updated_at = NOW()
    WHERE id = p_service_order_id;

    -- Log the status change event (this will be handled by the trigger)
    -- The trigger will automatically create the event log

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add comments to functions
COMMENT ON FUNCTION search_service_orders IS 'Advanced search for service orders with filtering and full-text search';
COMMENT ON FUNCTION get_service_orders_stats IS 'Get aggregated statistics for service orders dashboard';
COMMENT ON FUNCTION soft_delete_service_order IS 'Soft delete a service order (mark as deleted without removing data)';
COMMENT ON FUNCTION restore_service_order IS 'Restore a soft-deleted service order (admin only)';
COMMENT ON FUNCTION get_service_order_details IS 'Get complete service order details with related data counts';
COMMENT ON FUNCTION update_service_order_status IS 'Update service order status with automatic event logging';