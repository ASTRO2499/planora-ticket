-- Migration: Convert events.organizer_id to text and remove FK
-- Purpose: Use human-readable Organizer Secret IDs (e.g., WEB-SC-25)

-- 1) Drop FK if present (points to auth.users.id, UUID)
alter table public.events
  drop constraint if exists events_organizer_id_fkey;

-- 2) Convert column type to text (if it exists)
alter table public.events
  alter column organizer_id type text using organizer_id::text;

-- 3) Ensure column exists if missing
alter table public.events
  add column if not exists organizer_id text;

-- 4) Index for faster lookups by organizer secret
create index if not exists idx_events_organizer_id on public.events(organizer_id);
