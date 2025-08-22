-- Migration: Create service_orders table with indexes, triggers, and RLS policies
-- Date: 2024-01-17
-- Description: Main table for service orders with full-text search, soft delete, and security

-- Add feature flag to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS service_orders_beta_enabled BOOLEAN DEFAULT false;

-- Create service_orders table
CREATE TABLE service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID DEFAULT auth.uid() NOT NULL,
    client_id UUID REFERENCES clients(id),
    device_type VARCHAR(100) NOT NULL,
    device_model VARCHAR(100) NOT NULL,
    imei_serial VARCHAR(50),
    reported_issue TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'opened' CHECK (status IN ('opened', 'in_progress', 'completed', 'delivered')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    total_price DECIMAL(10,2) DEFAULT 0,
    labor_cost DECIMAL(10,2) DEFAULT 0,
    parts_cost DECIMAL(10,2) DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    delivery_date TIMESTAMP WITH TIME ZONE,
    warranty_months INTEGER DEFAULT 3,
    notes TEXT,
    search_vector tsvector,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID
);

-- Create indexes for performance
CREATE INDEX idx_service_orders_owner_id ON service_orders(owner_id);
CREATE INDEX idx_service_orders_status ON service_orders(status);
CREATE INDEX idx_service_orders_created_at ON service_orders(created_at DESC);
CREATE INDEX idx_service_orders_search ON service_orders USING GIN(search_vector);
CREATE INDEX idx_service_orders_deleted_at ON service_orders(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_orders_client_id ON service_orders(client_id);
CREATE INDEX idx_service_orders_priority ON service_orders(priority);

-- Create or replace function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_service_orders_updated_at
    BEFORE UPDATE ON service_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_service_orders_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('portuguese', 
        COALESCE(NEW.device_type, '') || ' ' ||
        COALESCE(NEW.device_model, '') || ' ' ||
        COALESCE(NEW.imei_serial, '') || ' ' ||
        COALESCE(NEW.reported_issue, '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for search vector
CREATE TRIGGER update_service_orders_search_vector_trigger
    BEFORE INSERT OR UPDATE ON service_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_service_orders_search_vector();

-- Enable Row Level Security
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policy for SELECT
CREATE POLICY "service_orders_select_policy" ON service_orders
    FOR SELECT USING (
        (owner_id = auth.uid() AND deleted_at IS NULL) OR 
        public.is_current_user_admin()
    );

-- RLS Policy for INSERT
CREATE POLICY "service_orders_insert_policy" ON service_orders
    FOR INSERT WITH CHECK (
        owner_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (service_orders_beta_enabled = true OR public.is_current_user_admin())
        )
    );

-- RLS Policy for UPDATE
CREATE POLICY "service_orders_update_policy" ON service_orders
    FOR UPDATE USING (
        (owner_id = auth.uid() AND deleted_at IS NULL) OR 
        public.is_current_user_admin()
    );

-- RLS Policy for DELETE
CREATE POLICY "service_orders_delete_policy" ON service_orders
    FOR DELETE USING (
        (owner_id = auth.uid()) OR 
        public.is_current_user_admin()
    );

-- Insert additional device types if they don't exist
INSERT INTO device_types (name) VALUES 
    ('Smartphone'),
    ('Tablet'),
    ('Notebook'),
    ('Desktop'),
    ('Smartwatch'),
    ('Fone de Ouvido')
ON CONFLICT (name) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE service_orders IS 'Service orders for technical repair management with soft delete and full-text search capabilities';
COMMENT ON COLUMN service_orders.search_vector IS 'Full-text search vector for device info and reported issues';
COMMENT ON COLUMN service_orders.deleted_at IS 'Soft delete timestamp - NULL means active record';
COMMENT ON COLUMN service_orders.owner_id IS 'User who owns this service order - used for RLS';