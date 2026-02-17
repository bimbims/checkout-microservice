-- Migration: Update deposit amount to R$ 800,00 (80000 cents)
-- Date: 2026-02-26
-- Run this in Supabase SQL Editor
-- Project: https://supabase.com/dashboard/project/kminwgatqbhbcammpzxh/sql

-- This updates the deposit amount from R$ 1.000,00 to R$ 800,00

-- 1. Ensure system_settings table exists (run migration 002 first if needed)
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Disable RLS if enabled
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- 3. Insert or update deposit_amount to 80000 cents (R$ 800,00)
INSERT INTO system_settings (key, value, description, updated_by)
VALUES (
  'deposit_amount',
  '{"amount": 80000, "currency": "BRL", "display": "R$ 800,00"}',
  'Valor padrão da caução em centavos',
  'admin'
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = '{"amount": 80000, "currency": "BRL", "display": "R$ 800,00"}',
  updated_by = 'admin',
  updated_at = NOW();

-- 4. Verify the update
SELECT 
  key,
  value,
  value->>'amount' as amount_cents,
  value->>'display' as display_value,
  description,
  updated_by,
  updated_at
FROM system_settings 
WHERE key = 'deposit_amount';

-- Expected result:
-- key: deposit_amount
-- value: {"amount": 80000, "currency": "BRL", "display": "R$ 800,00"}
-- amount_cents: 80000
-- display_value: R$ 800,00

-- 5. Test the API will read this correctly
SELECT 
  (value->>'amount')::integer as amount_in_cents,
  ((value->>'amount')::integer / 100.0) as amount_in_reais
FROM system_settings 
WHERE key = 'deposit_amount';

-- Expected: 80000 cents = 800.00 reais
