-- Create tickets table (if not exists)
create table if not exists public.tickets (
  id uuid not null default gen_random_uuid(),
  created_at timestamptz null default now(),
  name text not null,
  email text not null,
  payment_id text not null,
  status text null default 'issued',
  user_id uuid null default auth.uid(),
  "IEEE Number" bigint null,
  "College Name" text null,
  constraint tickets_pkey primary key (id),
  constraint tickets_payment_id_key unique (payment_id),
  constraint tickets_status_check check (
    status = any (array['pending','issued','failed','redeemed','cancelled'])
  )
);

-- Helpful indexes
create index if not exists tickets_email_idx on public.tickets (email);
create index if not exists tickets_payment_id_idx on public.tickets (payment_id);
