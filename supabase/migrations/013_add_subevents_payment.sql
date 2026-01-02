-- Add price and payment fields to sub_events table
ALTER TABLE sub_events
ADD COLUMN IF NOT EXISTS price_inr DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_collected DECIMAL(10, 2) DEFAULT 0;

-- Create index for payment status queries
CREATE INDEX IF NOT EXISTS idx_sub_event_registrations_payment_status ON sub_event_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_sub_event_registrations_payment_method ON sub_event_registrations(payment_method);
