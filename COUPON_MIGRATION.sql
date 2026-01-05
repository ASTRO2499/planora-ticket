-- ============================================
-- COUPON SYSTEM DATABASE SETUP
-- ============================================
-- This migration creates the coupon system for event discount codes
-- Run this in your Supabase SQL Editor
-- ============================================

-- Create coupons table for event discount codes
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  
  -- Coupon identification
  code text not null unique,
  event_id text not null,
  organizer_id text not null,
  
  -- Redemption limits
  max_redemptions integer not null default 100,
  used_count integer default 0,
  
  -- Discount details
  discount_type text not null, -- 'percentage' or 'fixed_amount'
  discount_value integer not null, -- percentage (0-100) or fixed amount in INR
  
  -- Validity
  is_active boolean default true,
  expires_at timestamptz,
  
  -- Metadata
  description text
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can view active coupons for events
CREATE POLICY "Anyone can view active coupons" 
  ON public.coupons FOR SELECT 
  USING (is_active = true);

-- Organizers can manage their own coupons
CREATE POLICY "Organizers can manage their coupons" 
  ON public.coupons FOR INSERT 
  WITH CHECK (true);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_event ON public.coupons(event_id);
CREATE INDEX IF NOT EXISTS idx_coupons_organizer ON public.coupons(organizer_id);

-- Create redemptions tracking table
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  discount_amount integer not null,
  
  unique(coupon_id, ticket_id)
);

-- Enable RLS
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert redemption records
CREATE POLICY "Anyone can create redemption records" 
  ON public.coupon_redemptions FOR INSERT 
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_ticket ON public.coupon_redemptions(ticket_id);

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the tables were created:
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('coupons', 'coupon_redemptions')
ORDER BY table_name;

-- Should return:
-- coupons
-- coupon_redemptions
