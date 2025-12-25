-- Add contact fields to tickets table to match application inserts
alter table public.tickets
  add column if not exists phone text,
  add column if not exists college text,
  add column if not exists ieee text;

-- Optional: add indexes for lookups
create index if not exists tickets_phone_idx on public.tickets (phone);
create index if not exists tickets_college_idx on public.tickets (college);
