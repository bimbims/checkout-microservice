-- Add booking_data column to checkout_sessions for storing booking details
ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS booking_data JSONB;

-- Add comment
COMMENT ON COLUMN checkout_sessions.booking_data IS 'Cached booking data from main system for faster checkout loading';
