-- Migration: Create service_order_attachments table
-- Date: 2024-01-17
-- Description: Attachments table for files and images associated with service orders

-- Create service_order_attachments table
CREATE TABLE service_order_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER CHECK (file_size > 0),
    mime_type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID DEFAULT auth.uid()
);

-- Create indexes for performance
CREATE INDEX idx_service_order_attachments_service_order_id ON service_order_attachments(service_order_id);
CREATE INDEX idx_service_order_attachments_mime_type ON service_order_attachments(mime_type);
CREATE INDEX idx_service_order_attachments_created_at ON service_order_attachments(created_at DESC);
CREATE INDEX idx_service_order_attachments_uploaded_by ON service_order_attachments(uploaded_by);
CREATE INDEX idx_service_order_attachments_file_name ON service_order_attachments(file_name);

-- Function to log attachment events
CREATE OR REPLACE FUNCTION log_attachment_events()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO service_order_events (service_order_id, event_type, payload)
        VALUES (
            NEW.service_order_id,
            'attachment_added',
            jsonb_build_object(
                'attachment_id', NEW.id,
                'file_name', NEW.file_name,
                'file_size', NEW.file_size,
                'mime_type', NEW.mime_type,
                'description', NEW.description,
                'uploaded_at', NEW.created_at
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO service_order_events (service_order_id, event_type, payload)
        VALUES (
            OLD.service_order_id,
            'attachment_removed',
            jsonb_build_object(
                'attachment_id', OLD.id,
                'file_name', OLD.file_name,
                'file_size', OLD.file_size,
                'mime_type', OLD.mime_type,
                'removed_at', NOW()
            )
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers for attachment event logging
CREATE TRIGGER log_attachment_events_trigger
    AFTER INSERT OR DELETE ON service_order_attachments
    FOR EACH ROW
    EXECUTE FUNCTION log_attachment_events();

-- Function to validate file types (security measure)
CREATE OR REPLACE FUNCTION validate_attachment_mime_type()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow common image types
    IF NEW.mime_type NOT IN (
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) THEN
        RAISE EXCEPTION 'Tipo de arquivo não permitido: %', NEW.mime_type;
    END IF;
    
    -- Validate file size (max 10MB)
    IF NEW.file_size > 10485760 THEN
        RAISE EXCEPTION 'Arquivo muito grande. Tamanho máximo: 10MB';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for file validation
CREATE TRIGGER validate_attachment_mime_type_trigger
    BEFORE INSERT OR UPDATE ON service_order_attachments
    FOR EACH ROW
    EXECUTE FUNCTION validate_attachment_mime_type();

-- Enable Row Level Security
ALTER TABLE service_order_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policy for SELECT - can view attachments if can view the parent service order
CREATE POLICY "service_order_attachments_select_policy" ON service_order_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM service_orders so
            WHERE so.id = service_order_attachments.service_order_id
            AND ((so.owner_id = auth.uid() AND so.deleted_at IS NULL) OR public.is_current_user_admin())
        )
    );

-- RLS Policy for INSERT - can insert attachments if can edit the parent service order
CREATE POLICY "service_order_attachments_insert_policy" ON service_order_attachments
    FOR INSERT WITH CHECK (
        uploaded_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM service_orders so
            WHERE so.id = service_order_attachments.service_order_id
            AND ((so.owner_id = auth.uid() AND so.deleted_at IS NULL) OR public.is_current_user_admin())
        )
    );

-- RLS Policy for UPDATE - can update attachments if uploaded by user or admin
CREATE POLICY "service_order_attachments_update_policy" ON service_order_attachments
    FOR UPDATE USING (
        (uploaded_by = auth.uid() OR public.is_current_user_admin()) AND
        EXISTS (
            SELECT 1 FROM service_orders so
            WHERE so.id = service_order_attachments.service_order_id
            AND ((so.owner_id = auth.uid() AND so.deleted_at IS NULL) OR public.is_current_user_admin())
        )
    );

-- RLS Policy for DELETE - can delete attachments if uploaded by user or admin
CREATE POLICY "service_order_attachments_delete_policy" ON service_order_attachments
    FOR DELETE USING (
        (uploaded_by = auth.uid() OR public.is_current_user_admin()) AND
        EXISTS (
            SELECT 1 FROM service_orders so
            WHERE so.id = service_order_attachments.service_order_id
            AND ((so.owner_id = auth.uid()) OR public.is_current_user_admin())
        )
    );

-- Create storage bucket for service order attachments (if not exists)
-- Note: This would typically be done through Supabase dashboard or separate storage setup
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'service-orders',
--     'service-orders',
--     false,
--     10485760, -- 10MB
--     ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
-- ) ON CONFLICT (id) DO NOTHING;

-- Add comments to table
COMMENT ON TABLE service_order_attachments IS 'File attachments for service orders (images, documents, etc.)';
COMMENT ON COLUMN service_order_attachments.file_url IS 'URL to the file in Supabase storage or external storage';
COMMENT ON COLUMN service_order_attachments.file_name IS 'Original filename as uploaded by user';
COMMENT ON COLUMN service_order_attachments.file_size IS 'File size in bytes (max 10MB)';
COMMENT ON COLUMN service_order_attachments.mime_type IS 'MIME type of the file for validation and display';
COMMENT ON COLUMN service_order_attachments.description IS 'Optional description of the attachment';
COMMENT ON COLUMN service_order_attachments.uploaded_by IS 'User who uploaded the file';