-- Migration: Add system settings table for configurable deposit amount and other settings
-- Date: 2026-02-16
-- Run this in Supabase SQL Editor

-- 1. Create settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Insert default settings
INSERT INTO system_settings (key, value, description) VALUES
  ('deposit_amount', '{"amount": 100000, "currency": "BRL", "display": "R$ 1.000,00"}', 'Valor padrão da caução em centavos'),
  ('deposit_hold_duration', '{"days": 7}', 'Duração da pré-autorização de caução em dias'),
  ('checkout_expiration', '{"hours": 24}', 'Tempo de expiração do link de checkout')
ON CONFLICT (key) DO NOTHING;

-- 3. Create index
CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(key);

-- 4. Add trigger for updated_at (only if function exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
    CREATE TRIGGER update_system_settings_updated_at 
      BEFORE UPDATE ON system_settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 5. Disable RLS for system settings (it's configuration data, service key has access)
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- 6. Verify
SELECT * FROM system_settings ORDER BY key;
