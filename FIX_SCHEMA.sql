-- Run this SQL directly in Supabase SQL Editor to fix the schema
-- This will add the missing columns that are causing the ticket generation to fail

-- Step 1: Check if columns exist and rename legacy ones
DO $$
BEGIN
  -- Rename "College Name" to college if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'College Name'
  ) THEN
    EXECUTE 'ALTER TABLE public.tickets RENAME COLUMN "College Name" TO college';
  END IF;
  
  -- Rename "IEEE Number" to ieee if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'IEEE Number'
  ) THEN
    EXECUTE 'ALTER TABLE public.tickets RENAME COLUMN "IEEE Number" TO ieee';
  END IF;
END $$;

-- Step 2: Add missing columns if they don't exist
ALTER TABLE public.tickets 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS college TEXT,
  ADD COLUMN IF NOT EXISTS ieee TEXT,
  ADD COLUMN IF NOT EXISTS qr TEXT,
  ADD COLUMN IF NOT EXISTS used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

-- Step 3: Create helpful indexes
CREATE INDEX IF NOT EXISTS tickets_college_idx ON public.tickets(college);
CREATE INDEX IF NOT EXISTS tickets_phone_idx ON public.tickets(phone);
CREATE INDEX IF NOT EXISTS tickets_ieee_idx ON public.tickets(ieee);

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tickets'
ORDER BY ordinal_position;
