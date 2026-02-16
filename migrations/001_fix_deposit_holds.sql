-- Migration: Fix deposit_holds table to support SKIPPED and FAILED status
-- Date: 2026-02-16
-- Run this in Supabase SQL Editor

-- 1. Add house_name column if it doesn't exist
ALTER TABLE deposit_holds 
ADD COLUMN IF NOT EXISTS house_name TEXT;

-- 2. Allow NULL in pagbank_charge_id (for SKIPPED/FAILED deposits)
ALTER TABLE deposit_holds 
ALTER COLUMN pagbank_charge_id DROP NOT NULL;

-- 3. Update status constraint to include SKIPPED and FAILED
ALTER TABLE deposit_holds 
DROP CONSTRAINT IF EXISTS deposit_holds_status_check;

ALTER TABLE deposit_holds 
ADD CONSTRAINT deposit_holds_status_check 
CHECK (status IN ('AUTHORIZED', 'RELEASED', 'CAPTURED', 'EXPIRED', 'SKIPPED', 'FAILED'));

-- 4. Update index to include new statuses
DROP INDEX IF EXISTS idx_deposit_status;
CREATE INDEX idx_deposit_status ON deposit_holds(status) WHERE status IN ('AUTHORIZED', 'SKIPPED', 'FAILED');

-- Verify changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'deposit_holds'
ORDER BY ordinal_position;
