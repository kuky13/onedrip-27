-- Migration: Create service_order_items table
-- Date: 2024-01-17
-- Description: Items table for parts and labor in service orders with soft delete

-- Create service_order_items table
CREATE TABLE service_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    item_type VARCHAR(10) CHECK (item_type IN ('part', 'labor')),
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    warranty_months INTEGER DEFAULT 3 CHECK (warranty_months >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID
);

-- Create indexes for performance
CREATE INDEX idx_service_order_items_service_order_id ON service_order_items(service_order_id);
CREATE INDEX idx_service_order_items_item_type ON service_order_items(item_type);
CREATE INDEX idx_service_order_items_deleted_at ON service_order_items(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_order_items_created_at ON service_order_items(created_at DESC);

-- Function to update service order totals when items change
CREATE OR REPLACE FUNCTION update_service_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    order_id UUID;
    new_parts_cost DECIMAL(10,2);
    new_labor_cost DECIMAL(10,2);
    new_total_price DECIMAL(10,2);
BEGIN
    -- Get the service_order_id from either NEW or OLD record
    IF TG_OP = 'DELETE' THEN
        order_id := OLD.service_order_id;
    ELSE
        order_id := NEW.service_order_id;
    END IF;
    
    -- Calculate new totals for parts and labor
    SELECT 
        COALESCE(SUM(quantity * unit_price) FILTER (WHERE item_type = 'part' AND deleted_at IS NULL), 0),
        COALESCE(SUM(quantity * unit_price) FILTER (WHERE item_type = 'labor' AND deleted_at IS NULL), 0)
    INTO new_parts_cost, new_labor_cost
    FROM service_order_items
    WHERE service_order_id = order_id;
    
    new_total_price := new_parts_cost + new_labor_cost;
    
    -- Update the service order totals
    UPDATE service_orders
    SET 
        parts_cost = new_parts_cost,
        labor_cost = new_labor_cost,
        total_price = new_total_price,
        updated_at = NOW()
    WHERE id = order_id;
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

-- Create triggers to update totals
CREATE TRIGGER update_service_order_totals_on_insert
    AFTER INSERT ON service_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_service_order_totals();

CREATE TRIGGER update_service_order_totals_on_update
    AFTER UPDATE ON service_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_service_order_totals();

CREATE TRIGGER update_service_order_totals_on_delete
    AFTER DELETE ON service_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_service_order_totals();

-- Enable Row Level Security
ALTER TABLE service_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy for SELECT - can view items if can view the parent service order
CREATE POLICY "service_order_items_select_policy" ON service_order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM service_orders so
            WHERE so.id = service_order_items.service_order_id
            AND ((so.owner_id = auth.uid() AND so.deleted_at IS NULL) OR public.is_current_user_admin())
        )
    );

-- RLS Policy for INSERT - can insert items if can edit the parent service order
CREATE POLICY "service_order_items_insert_policy" ON service_order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM service_orders so
            WHERE so.id = service_order_items.service_order_id
            AND ((so.owner_id = auth.uid() AND so.deleted_at IS NULL) OR public.is_current_user_admin())
        )
    );

-- RLS Policy for UPDATE - can update items if can edit the parent service order
CREATE POLICY "service_order_items_update_policy" ON service_order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM service_orders so
            WHERE so.id = service_order_items.service_order_id
            AND ((so.owner_id = auth.uid() AND so.deleted_at IS NULL) OR public.is_current_user_admin())
        )
    );

-- RLS Policy for DELETE - can delete items if can edit the parent service order
CREATE POLICY "service_order_items_delete_policy" ON service_order_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM service_orders so
            WHERE so.id = service_order_items.service_order_id
            AND ((so.owner_id = auth.uid()) OR public.is_current_user_admin())
        )
    );

-- Add comments to table
COMMENT ON TABLE service_order_items IS 'Items (parts and labor) associated with service orders';
COMMENT ON COLUMN service_order_items.item_type IS 'Type of item: part or labor';
COMMENT ON COLUMN service_order_items.quantity IS 'Quantity of the item (must be positive)';
COMMENT ON COLUMN service_order_items.unit_price IS 'Price per unit (must be non-negative)';
COMMENT ON COLUMN service_order_items.warranty_months IS 'Warranty period in months for this item';
COMMENT ON COLUMN service_order_items.deleted_at IS 'Soft delete timestamp - NULL means active record';