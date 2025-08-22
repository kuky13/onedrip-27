-- Remove waiting_parts and waiting_client from service_order_status enum

-- First, update any existing records that have these statuses to 'pending'
UPDATE service_orders 
SET status = 'pending' 
WHERE status IN ('waiting_parts', 'waiting_client');

-- Update the check constraint to remove waiting_parts and waiting_client
ALTER TABLE service_orders 
DROP CONSTRAINT IF EXISTS service_orders_status_check;

ALTER TABLE service_orders 
ADD CONSTRAINT service_orders_status_check 
CHECK (status::text = ANY (ARRAY['opened'::character varying, 'pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'delivered'::character varying]::text[]));

-- Drop the existing enum type if it exists
DROP TYPE IF EXISTS service_order_status CASCADE;

-- Recreate the enum without waiting_parts and waiting_client
CREATE TYPE service_order_status AS ENUM (
  'opened',
  'pending',
  'in_progress', 
  'completed',
  'cancelled',
  'delivered'
);

-- Update any functions that might reference the old enum values
-- This ensures compatibility with the new enum structure
COMMENT ON TYPE service_order_status IS 'Updated enum without waiting_parts and waiting_client statuses';