-- Checkout Microservice Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/kminwgatqbhbcammpzxh/sql

-- Checkout sessions table
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  stay_amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PAID', 'EXPIRED', 'FAILED')),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkout_token ON checkout_sessions(token);
CREATE INDEX IF NOT EXISTS idx_checkout_booking ON checkout_sessions(booking_id);
CREATE INDEX IF NOT EXISTS idx_checkout_expires ON checkout_sessions(expires_at) WHERE status = 'PENDING';

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id UUID REFERENCES checkout_sessions(id),
  booking_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('STAY_PAYMENT', 'DEPOSIT_PREAUTH')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('PIX', 'CREDIT_CARD')),
  amount DECIMAL(10,2) NOT NULL,
  pagbank_charge_id TEXT UNIQUE,
  pagbank_status TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trans_session ON transactions(checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_trans_booking ON transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_trans_pagbank ON transactions(pagbank_charge_id);

-- Deposit holds table
CREATE TABLE IF NOT EXISTS deposit_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT UNIQUE NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  amount DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  pagbank_charge_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AUTHORIZED' CHECK (status IN ('AUTHORIZED', 'RELEASED', 'CAPTURED', 'EXPIRED')),
  authorized_at TIMESTAMP DEFAULT NOW(),
  released_at TIMESTAMP,
  captured_at TIMESTAMP,
  captured_amount DECIMAL(10,2),
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deposit_booking ON deposit_holds(booking_id);
CREATE INDEX IF NOT EXISTS idx_deposit_status ON deposit_holds(status) WHERE status = 'AUTHORIZED';

-- Payment logs table
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  details JSONB NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_booking ON payment_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_logs_event ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_logs_created ON payment_logs(created_at DESC);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_checkout_sessions_updated_at ON checkout_sessions;
CREATE TRIGGER update_checkout_sessions_updated_at BEFORE UPDATE ON checkout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deposit_holds_updated_at ON deposit_holds;
CREATE TRIGGER update_deposit_holds_updated_at BEFORE UPDATE ON deposit_holds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Allow public read for checkout validation, authenticated write only
DROP POLICY IF EXISTS "Allow public read checkout by token" ON checkout_sessions;
CREATE POLICY "Allow public read checkout by token" ON checkout_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role all on checkout_sessions" ON checkout_sessions;
CREATE POLICY "Allow service role all on checkout_sessions" ON checkout_sessions FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role all on transactions" ON transactions;
CREATE POLICY "Allow service role all on transactions" ON transactions FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role all on deposit_holds" ON deposit_holds;
CREATE POLICY "Allow service role all on deposit_holds" ON deposit_holds FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role all on payment_logs" ON payment_logs;
CREATE POLICY "Allow service role all on payment_logs" ON payment_logs FOR ALL USING (auth.role() = 'service_role');
