-- =====================================================
-- MIGRATION 014: ADD TRACK REGISTRATION FIELDS
-- Update sub_event_registrations to support track registration
-- =====================================================

-- Add missing columns for track registration
ALTER TABLE public.sub_event_registrations
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'not_required',
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rating INTEGER,
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Add constraints for new payment fields
ALTER TABLE public.sub_event_registrations
ADD CONSTRAINT check_valid_payment_method 
  CHECK (payment_method IN ('online', 'offline')) NOT VALID;

ALTER TABLE public.sub_event_registrations
ADD CONSTRAINT check_valid_payment_status 
  CHECK (payment_status IN ('paid', 'pending', 'not_required')) NOT VALID;

ALTER TABLE public.sub_event_registrations
ADD CONSTRAINT check_valid_rating 
  CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)) NOT VALID;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sub_event_registrations_email 
  ON public.sub_event_registrations(email);

CREATE INDEX IF NOT EXISTS idx_sub_event_registrations_payment_status 
  ON public.sub_event_registrations(payment_status);

CREATE INDEX IF NOT EXISTS idx_sub_event_registrations_payment_method 
  ON public.sub_event_registrations(payment_method);

-- Unique index for preventing duplicate registrations per email per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_registration_per_session 
  ON public.sub_event_registrations(sub_event_id, email) 
  WHERE email IS NOT NULL;
