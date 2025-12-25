-- Create table for email-based OTP authentication
create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  used boolean default false
);

create index if not exists email_otps_email_idx on public.email_otps(email);
create index if not exists email_otps_expires_idx on public.email_otps(expires_at);
