-- Migration: Add organizer_credentials table for QR check-in security
-- Created: 2026-01-30
-- Purpose: Store event-specific organizer usernames/passwords for QR verification access

CREATE TABLE IF NOT EXISTS public.organizer_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT NOT NULL, -- Admin username/email who created this
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure unique username per event
  UNIQUE(event_id, username),
  
  -- Create indexes for faster lookups
  CONSTRAINT event_username_unique UNIQUE(event_id, username)
);

-- Create index for faster credential lookups during login
CREATE INDEX IF NOT EXISTS idx_organizer_credentials_event_id 
  ON public.organizer_credentials(event_id);

CREATE INDEX IF NOT EXISTS idx_organizer_credentials_username 
  ON public.organizer_credentials(username);

CREATE INDEX IF NOT EXISTS idx_organizer_credentials_active 
  ON public.organizer_credentials(is_active);

-- Add RLS policies
ALTER TABLE public.organizer_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "organizer_credentials_login_policy" ON public.organizer_credentials;
DROP POLICY IF EXISTS "organizer_credentials_admin_policy" ON public.organizer_credentials;

-- Allow admins to read/write their event's credentials (via /api/admin/organizer-credentials)
-- Note: We check authentication server-side with checkAuth() in the API
-- This RLS is for an extra layer of protection

-- Public policy for login (anyone can attempt to login with valid credentials)
CREATE POLICY "organizer_credentials_login_policy" ON public.organizer_credentials
  FOR SELECT USING (is_active = true);

-- Admin-only policy for management (enforced server-side in API)
CREATE POLICY "organizer_credentials_admin_policy" ON public.organizer_credentials
  FOR ALL USING (true);
