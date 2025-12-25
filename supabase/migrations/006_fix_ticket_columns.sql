-- Ensure ticket columns align with application expectations
-- Rename legacy quoted columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tickets'
      AND column_name = 'College Name'
  ) THEN
    EXECUTE 'alter table public.tickets rename column "College Name" to college';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tickets'
      AND column_name = 'IEEE Number'
  ) THEN
    EXECUTE 'alter table public.tickets rename column "IEEE Number" to ieee';
  END IF;
END $$;

-- Add missing columns if they do not exist
alter table public.tickets
  add column if not exists phone text,
  add column if not exists college text,
  add column if not exists ieee text;

-- Optional indexes for lookups
create index if not exists tickets_college_idx on public.tickets (college);
create index if not exists tickets_ieee_idx on public.tickets (ieee);
