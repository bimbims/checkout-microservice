-- Migration: Fix system_settings access (disable RLS)
-- Date: 2026-02-16
-- Run this in Supabase SQL Editor to fix the 500 error on generate-checkout
-- This is a quick fix to unblock the system

-- The issue: RLS was enabled but no policies were created
-- Solution: Disable RLS for system_settings table since it's configuration data

-- 1. Disable RLS (system_settings is configuration, not user data)
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- 2. Verify it's disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'system_settings';

-- 3. Test that the query works now
SELECT * FROM system_settings WHERE key = 'deposit_amount';

-- Expected result:
-- {"amount": 100000, "currency": "BRL", "display": "R$ 1.000,00"}
