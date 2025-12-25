-- =====================================================
-- PLANORA TICKETING PLATFORM - COMPLETE SCHEMA
-- Updated: December 2025
-- =====================================================

-- 1. EVENTS TABLE (Stores event details)
-- Drop and recreate to ensure clean state
drop table if exists public.events cascade;

create table public.events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  title text not null,
  description text,
  location text,
  date timestamptz,
  image_url text, -- URL to uploaded cover image in Supabase Storage
  price_inr integer default 0,
  organizer_id text, -- Per-event organizer secret/code used for portal access
  is_published boolean default true
);

-- Enable RLS for events
alter table public.events enable row level security;

-- Public read access for published events
create policy "Published events are viewable by everyone" 
  on public.events for select 
  using (is_published = true);

-- Allow anyone to create events (hosting feature)
create policy "Anyone can create events" 
  on public.events for insert 
  with check (true);


-- 2. TICKETS TABLE (Stores ticket registrations)
-- Drop and recreate to ensure all columns exist
drop table if exists public.tickets cascade;

create table public.tickets (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  
  -- Event reference
  event_id text, -- Can be UUID or static ID like 'akcomsoc-2025'
  
  -- User details
  name text not null,
  email text not null,
  phone text,
  college text,
  ieee text, -- IEEE membership number
  
  -- Payment details
  payment_id text,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount_paid integer,
  
  -- Ticket status
  status text default 'pending', -- 'pending', 'issued', 'cancelled'
  qr text, -- QR code data
  used boolean default false,
  used_at timestamptz,
  checked_in_at timestamptz
);

-- Enable RLS for tickets
alter table public.tickets enable row level security;

-- Users can view their own tickets by email
create policy "Users can view their own tickets by email" 
  on public.tickets for select 
  using (true); -- Open for admin dashboard and email lookup

-- Anyone can create tickets (registration)
create policy "Anyone can create tickets" 
  on public.tickets for insert 
  with check (true);

-- Allow updates for payment verification and status changes
create policy "Allow ticket updates" 
  on public.tickets for update 
  using (true);

-- Allow deletes (admin feature)
create policy "Allow ticket deletes" 
  on public.tickets for delete 
  using (true);


-- 3. PROFILES TABLE (Optional - for future user management)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user',
  org_name text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone" 
  on public.profiles for select 
  using (true);

create policy "Users can insert their own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);


-- =====================================================
-- SUPABASE STORAGE SETUP
-- =====================================================

-- Create storage bucket for event cover images
insert into storage.buckets (id, name, public)
values ('event-covers', 'event-covers', true)
on conflict (id) do nothing;

-- Storage policies for event-covers bucket
create policy "Public can view event covers"
  on storage.objects for select
  using (bucket_id = 'event-covers');

create policy "Anyone can upload event covers"
  on storage.objects for insert
  with check (bucket_id = 'event-covers');

create policy "Anyone can update event covers"
  on storage.objects for update
  using (bucket_id = 'event-covers');


-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

create index if not exists idx_tickets_email on public.tickets(email);
create index if not exists idx_tickets_event_id on public.tickets(event_id);
create index if not exists idx_tickets_payment_id on public.tickets(payment_id);
create index if not exists idx_tickets_status on public.tickets(status);
create index if not exists idx_events_published on public.events(is_published);
create index if not exists idx_events_created_at on public.events(created_at desc);
create index if not exists idx_events_organizer_id on public.events(organizer_id);


-- =====================================================
-- SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Note: AKCOMSOC 2025 event is hardcoded in the application
-- Additional events can be created through the /host page
