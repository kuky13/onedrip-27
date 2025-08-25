-- Migration to remove PIX/Mercado Pago system components
-- This migration removes all PIX-related tables, policies, and functions

-- Drop RLS policies first
DROP POLICY IF EXISTS "Users can view their own transactions" ON pix_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON pix_transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON pix_transactions;
DROP POLICY IF EXISTS "Edge functions can access transactions by email" ON pix_transactions;
DROP POLICY IF EXISTS "Service role can access all transactions" ON pix_transactions;
DROP POLICY IF EXISTS "Authenticated users can view their transactions" ON pix_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON pix_transactions;
DROP POLICY IF EXISTS "Authenticated users can update their transactions" ON pix_transactions;

-- Drop tables with CASCADE to remove all dependencies
DROP TABLE IF EXISTS pix_transactions CASCADE;
DROP TABLE IF EXISTS transaction_logs CASCADE;
DROP TABLE IF EXISTS payment_conditions CASCADE;

-- Drop any PIX-related functions if they exist
DROP FUNCTION IF EXISTS create_pix_transaction CASCADE;
DROP FUNCTION IF EXISTS update_pix_transaction_status CASCADE;
DROP FUNCTION IF EXISTS get_pix_transaction_by_id CASCADE;

-- Drop any PIX-related indexes if they exist
DROP INDEX IF EXISTS idx_pix_transactions_user_id;
DROP INDEX IF EXISTS idx_pix_transactions_status;
DROP INDEX IF EXISTS idx_pix_transactions_created_at;
DROP INDEX IF EXISTS idx_pix_transactions_external_id;

-- Drop any PIX-related triggers if they exist
DROP TRIGGER IF EXISTS update_pix_transactions_updated_at ON pix_transactions;
DROP TRIGGER IF EXISTS pix_transaction_audit_trigger ON pix_transactions;

-- Clean up any PIX-related sequences
DROP SEQUENCE IF EXISTS pix_transactions_id_seq CASCADE;

-- Remove any PIX-related types
DROP TYPE IF EXISTS pix_transaction_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;

COMMIT;