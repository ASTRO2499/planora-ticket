-- Add pricing tiers to events table
-- Allows organizers to set two different price points (e.g., IEEE vs Non-IEEE, VIP vs Regular)

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS tier_1_enabled boolean default true,
ADD COLUMN IF NOT EXISTS tier_1_name text default 'Option 1',
ADD COLUMN IF NOT EXISTS tier_1_price integer default 0,
ADD COLUMN IF NOT EXISTS tier_2_enabled boolean default true,
ADD COLUMN IF NOT EXISTS tier_2_name text default 'Option 2',
ADD COLUMN IF NOT EXISTS tier_2_price integer default 0;

-- Add tier selection to tickets table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS tier_selected text,
ADD COLUMN IF NOT EXISTS tier_price integer;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_tier_selected ON public.tickets(tier_selected);
