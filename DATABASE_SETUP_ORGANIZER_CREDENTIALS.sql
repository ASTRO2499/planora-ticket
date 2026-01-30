-- ============================================================================
-- ORGANIZER CREDENTIALS TABLE FOR QR CHECK-IN AUTHENTICATION
-- ============================================================================
-- This table stores username/password pairs for event check-in staff
-- Migration: 023_add_organizer_credentials.sql

-- Drop existing table if needed (for re-initialization)
-- DROP TABLE IF EXISTS public.organizer_credentials CASCADE;

-- Create the main organizer_credentials table
CREATE TABLE IF NOT EXISTS public.organizer_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure unique username per event
  UNIQUE(event_id, username),
  CONSTRAINT event_username_unique UNIQUE(event_id, username)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizer_credentials_event_id 
  ON public.organizer_credentials(event_id);

CREATE INDEX IF NOT EXISTS idx_organizer_credentials_username 
  ON public.organizer_credentials(username);

CREATE INDEX IF NOT EXISTS idx_organizer_credentials_active 
  ON public.organizer_credentials(is_active);

-- Enable Row Level Security
ALTER TABLE public.organizer_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "organizer_credentials_login_policy" ON public.organizer_credentials;
DROP POLICY IF EXISTS "organizer_credentials_admin_policy" ON public.organizer_credentials;

-- Policy: Allow anyone to SELECT active credentials (for login endpoint)
CREATE POLICY "organizer_credentials_login_policy" ON public.organizer_credentials
  FOR SELECT USING (is_active = true);

-- Policy: Allow all operations (enforced server-side in API)
CREATE POLICY "organizer_credentials_admin_policy" ON public.organizer_credentials
  FOR ALL USING (true);

-- ============================================================================
-- VERIFICATION QUERY - Run this to verify table exists and is accessible
-- ============================================================================
-- SELECT id, username, is_active, created_at, last_used_at 
-- FROM organizer_credentials 
-- LIMIT 5;
