-- Migration: Create service_order_events table
-- Date: 2024-01-17
-- Description: Events table for timeline and audit logging of service orders

-- Create service_order_events table
CREATE TABLE service_order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID DEFAULT auth.uid()
);

-- Create indexes for performance
CREATE INDEX idx_service_order_events_service_order_id ON service_order_events(service_order_id);
CREATE INDEX idx_service_order_events_event_type ON service_order_events(event_type);
CREATE INDEX idx_service_order_events_created_at ON service_order_events(created_at DESC);
CREATE INDEX idx_service_order_events_created_by ON service_order_events(created_by);
CREATE INDEX idx_service_order_events_payload ON service_order_events USING GIN(payload);

-- Function to automatically log service order status changes
CREATE OR REPLACE FUNCTION log_service_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO service_order_events (service_order_id, event_type, payload)
        VALUES (
            NEW.id,
            'status_changed',
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'changed_at', NOW()
            )
        );
    END IF;
    
    -- Log payment status changes
    IF OLD.is_paid IS DISTINCT FROM NEW.is_paid THEN
        INSERT INTO service_order_events (service_order_id, event_type, payload)
        VALUES (
            NEW.id,
            CASE WHEN NEW.is_paid THEN 'payment_confirmed' ELSE 'payment_reverted' END,
            jsonb_build_object(
                'is_paid', NEW.is_paid,
                'total_price', NEW.total_price,
                'changed_at', NOW()
            )
        );
    END IF;
    
    -- Log delivery date changes
    IF OLD.delivery_date IS DISTINCT FROM NEW.delivery_date THEN
        INSERT INTO service_order_events (service_order_id, event_type, payload)
        VALUES (
            NEW.id,
            'delivery_date_changed',
            jsonb_build_object(
                'old_delivery_date', OLD.delivery_date,
                'new_delivery_date', NEW.delivery_date,
                'changed_at', NOW()
            )
        );
    END IF;
    
    -- Log priority changes
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
        INSERT INTO service_order_events (service_order_id, event_type, payload)
        VALUES (
            NEW.id,
            'priority_changed',
            jsonb_build_object(
                'old_priority', OLD.priority,
                'new_priority', NEW.priority,
                'changed_at', NOW()
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to log service order creation
CREATE OR REPLACE FUNCTION log_service_order_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO service_order_events (service_order_id, event_type, payload)
    VALUES (
        NEW.id,
        'order_created',
        jsonb_build_object(
            'device_type', NEW.device_type,
            'device_model', NEW.device_model,
            'status', NEW.status,
            'priority', NEW.priority,
            'created_at', NEW.created_at
        )
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic event logging
CREATE TRIGGER log_service_order_creation_trigger
    AFTER INSERT ON service_orders
    FOR EACH ROW
    EXECUTE FUNCTION log_service_order_creation();

CREATE TRIGGER log_service_order_status_change_trigger
    AFTER UPDATE ON service_orders
    FOR EACH ROW
    EXECUTE FUNCTION log_service_order_status_change();

-- Function to log item changes
CREATE OR REPLACE FUNCTION log_service_order_item_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO service_order_events (service_order_id, event_type, payload)
        VALUES (
            NEW.service_order_id,
            'item_added',
            jsonb_build_object(
                'item_id', NEW.id,
                'name', NEW.name,
                'item_type', NEW.item_type,
                'quantity', NEW.quantity,
                'unit_price', NEW.unit_price,
                'added_at', NEW.created_at
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO service_order_events (service_order_id, event_type, payload)
        VALUES (
            NEW.service_order_id,
            'item_updated',
            jsonb_build_object(
                'item_id', NEW.id,
                'name', NEW.name,
                'old_quantity', OLD.quantity,
                'new_quantity', NEW.quantity,
                'old_unit_price', OLD.unit_price,
                'new_unit_price', NEW.unit_price,
                'updated_at', NOW()
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO service_order_events (service_order_id, event_type, payload)
        VALUES (
            OLD.service_order_id,
            'item_removed',
            jsonb_build_object(
                'item_id', OLD.id,
                'name', OLD.name,
                'item_type', OLD.item_type,
                'quantity', OLD.quantity,
                'unit_price', OLD.unit_price,
                'removed_at', NOW()
            )
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers for item change logging
CREATE TRIGGER log_service_order_item_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON service_order_items
    FOR EACH ROW
    EXECUTE FUNCTION log_service_order_item_changes();

-- Enable Row Level Security
ALTER TABLE service_order_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy for SELECT - can view events if can view the parent service order
CREATE POLICY "service_order_events_select_policy" ON service_order_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM service_orders so
            WHERE so.id = service_order_events.service_order_id
            AND ((so.owner_id = auth.uid() AND so.deleted_at IS NULL) OR public.is_current_user_admin())
        )
    );

-- RLS Policy for INSERT - can insert events if can edit the parent service order
CREATE POLICY "service_order_events_insert_policy" ON service_order_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM service_orders so
            WHERE so.id = service_order_events.service_order_id
            AND ((so.owner_id = auth.uid() AND so.deleted_at IS NULL) OR public.is_current_user_admin())
        )
    );

-- RLS Policy for UPDATE - only admins can update events (for data integrity)
CREATE POLICY "service_order_events_update_policy" ON service_order_events
    FOR UPDATE USING (public.is_current_user_admin());

-- RLS Policy for DELETE - only admins can delete events (for audit integrity)
CREATE POLICY "service_order_events_delete_policy" ON service_order_events
    FOR DELETE USING (public.is_current_user_admin());

-- Add comments to table
COMMENT ON TABLE service_order_events IS 'Timeline and audit events for service orders';
COMMENT ON COLUMN service_order_events.event_type IS 'Type of event (e.g., status_changed, payment_confirmed, item_added)';
COMMENT ON COLUMN service_order_events.payload IS 'JSON payload with event-specific data';
COMMENT ON COLUMN service_order_events.created_by IS 'User who triggered the event (NULL for system events)';