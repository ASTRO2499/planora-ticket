-- Migration Script: Add Dynamic Form Fields Support
-- Run this in your Supabase SQL Editor
-- Date: 2025-12-27

-- ============================================
-- 1. Add extra columns to tickets table
-- ============================================
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS extra1 TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS extra2 TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS extra3 TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS extra4 TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS extra5 TEXT;

-- ============================================
-- 2. Create event_form_settings table
-- ============================================
CREATE TABLE IF NOT EXISTS event_form_settings (
  event_id TEXT PRIMARY KEY,
  field_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_form_settings_event ON event_form_settings(event_id);

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify the migrations worked:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'tickets' AND column_name LIKE 'extra%';
-- SELECT * FROM event_form_settings LIMIT 1;
