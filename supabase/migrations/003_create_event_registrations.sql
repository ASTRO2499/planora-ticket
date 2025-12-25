-- Event registrations table for AKCOMSOC 2025 and future events
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  name text not null,
  email text not null,
  phone text,
  college text,
  ieee text,
  payment_id text,
  razorpay_order_id text,
  status text not null default 'pending', -- pending | paid | failed | canceled
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Useful indexes
create index if not exists event_registrations_event_id_idx on public.event_registrations (event_id);
create index if not exists event_registrations_email_idx on public.event_registrations (email);
create index if not exists event_registrations_payment_id_idx on public.event_registrations (payment_id);

-- Updated-at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_event_registrations_updated_at on public.event_registrations;
create trigger set_event_registrations_updated_at
before update on public.event_registrations
for each row
execute function public.set_updated_at();
