-- =====================================================
-- MIGRATION 013: VERIFY AND ADD MISSING CONSTRAINTS
-- =====================================================
-- This migration ensures all necessary constraints exist
-- in the sub_events and sub_event_registrations tables

-- Check if event_id column type is correct (should be uuid not text)
-- If migration 012 had it as TEXT, this will fix it

-- Verify sub_events table has all payment fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sub_events' AND column_name = 'price_inr'
  ) THEN
    ALTER TABLE public.sub_events ADD COLUMN price_inr DECIMAL(10, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sub_events' AND column_name = 'requires_payment'
  ) THEN
    ALTER TABLE public.sub_events ADD COLUMN requires_payment BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sub_events' AND column_name = 'payment_collected'
  ) THEN
    ALTER TABLE public.sub_events ADD COLUMN payment_collected DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Verify sub_event_registrations table has all fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sub_event_registrations' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.sub_event_registrations ADD COLUMN name TEXT NOT NULL DEFAULT 'Anonymous';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sub_event_registrations' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.sub_event_registrations ADD COLUMN email TEXT NOT NULL DEFAULT 'unknown@example.com';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sub_event_registrations' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.sub_event_registrations ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sub_event_registrations' AND column_name = 'college'
  ) THEN
    ALTER TABLE public.sub_event_registrations ADD COLUMN college TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sub_event_registrations' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.sub_event_registrations ADD COLUMN notes TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sub_event_registrations' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.sub_event_registrations ADD COLUMN payment_status TEXT DEFAULT 'not_required';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sub_event_registrations' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE public.sub_event_registrations ADD COLUMN payment_id TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sub_event_registrations' AND column_name = 'registered_at'
  ) THEN
    ALTER TABLE public.sub_event_registrations ADD COLUMN registered_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_sub_events_event_id ON public.sub_events(event_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_status ON public.sub_events(status);
CREATE INDEX IF NOT EXISTS idx_sub_events_published ON public.sub_events(is_published);

CREATE INDEX IF NOT EXISTS idx_sub_event_registrations_sub_event_id ON public.sub_event_registrations(sub_event_id);
CREATE INDEX IF NOT EXISTS idx_sub_event_registrations_email ON public.sub_event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_sub_event_registrations_payment_status ON public.sub_event_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_sub_event_registrations_payment_method ON public.sub_event_registrations(payment_method);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_registration_per_session ON public.sub_event_registrations(sub_event_id, email);
