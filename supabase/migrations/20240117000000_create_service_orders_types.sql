-- Migration: Create Service Orders Custom Types
-- Date: 2024-01-17
-- Description: Create custom enum types for service orders

-- Create service order status enum (if not exists)
DO $$ BEGIN
    CREATE TYPE service_order_status AS ENUM (
        'pending',
        'in_progress', 
        'waiting_parts',
        'waiting_client',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create service order priority enum (if not exists)
DO $$ BEGIN
    CREATE TYPE service_order_priority AS ENUM (
        'low',
        'medium',
        'high',
        'urgent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- payment_status type already exists in the system

-- Add comments to types
COMMENT ON TYPE service_order_status IS 'Status of a service order throughout its lifecycle';
COMMENT ON TYPE service_order_priority IS 'Priority level of a service order';
COMMENT ON TYPE payment_status IS 'Payment status of a service order';