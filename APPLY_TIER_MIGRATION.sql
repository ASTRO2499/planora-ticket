-- ============================================
-- URGENT FIX: Add Missing Tier Columns
-- ============================================
-- This migration adds the tier_price and tier_selected columns
-- that are required by the verify-payment API
--
-- HOW TO APPLY:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire file
-- 5. Click "Run"
-- ============================================

-- Add pricing tier columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS tier_1_enabled boolean default true,
ADD COLUMN IF NOT EXISTS tier_1_name text default 'Option 1',
ADD COLUMN IF NOT EXISTS tier_1_price integer default 0,
ADD COLUMN IF NOT EXISTS tier_2_enabled boolean default true,
ADD COLUMN IF NOT EXISTS tier_2_name text default 'Option 2',
ADD COLUMN IF NOT EXISTS tier_2_price integer default 0;

-- Add tier selection columns to tickets table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS tier_selected text,
ADD COLUMN IF NOT EXISTS tier_price integer;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_tier_selected ON public.tickets(tier_selected);

-- ============================================
-- Verification
-- ============================================
-- Run this to verify the migration worked:
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
  AND column_name IN ('tier_selected', 'tier_price');

-- You should see 2 rows returned:
-- tier_selected | text
-- tier_price    | integer
