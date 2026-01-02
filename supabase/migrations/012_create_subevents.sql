-- =====================================================
-- CREATE SUB_EVENTS TABLE
-- For storing workshops, talk sessions, and other
-- sub-events/sessions under main events
-- =====================================================

create table if not exists public.sub_events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Reference to parent event (must match events table type)
  event_id uuid not null,
  
  -- Sub-event details
  title text not null,
  description text,
  type text not null, -- e.g., 'workshop', 'talk', 'session', 'panel', etc.
  start_time timestamptz,
  end_time timestamptz,
  location text,
  
  -- Capacity management
  max_capacity integer,
  current_registrations integer default 0,
  
  -- Payment fields
  price_inr decimal(10, 2) default 0,
  requires_payment boolean default false,
  payment_collected decimal(10, 2) default 0,
  
  -- Additional info
  speaker_name text,
  speaker_email text,
  speaker_bio text,
  image_url text,
  
  -- Status
  status text default 'active', -- 'active', 'cancelled', 'completed'
  is_published boolean default true,
  
  -- Metadata
  metadata jsonb default '{}'::jsonb,
  
  -- Constraints
  constraint fk_sub_events_event_id foreign key (event_id) references public.events(id) on delete cascade,
  constraint check_valid_type check (type in ('workshop', 'talk', 'panel', 'breakout', 'networking', 'other')),
  constraint check_valid_status check (status in ('active', 'cancelled', 'completed')),
  constraint check_positive_capacity check (max_capacity is null or max_capacity > 0),
  constraint check_positive_price check (price_inr >= 0)
);

-- Enable RLS for sub_events
alter table public.sub_events enable row level security;

-- Public read access for published sub-events
create policy "Published sub_events are viewable by everyone" 
  on public.sub_events for select 
  using (is_published = true);

-- Allow organizers to manage their event's sub-events (via backend validation)
create policy "Anyone can create sub_events" 
  on public.sub_events for insert 
  with check (true);

-- Allow updates
create policy "Allow sub_events updates" 
  on public.sub_events for update 
  using (true);

-- Allow deletes
create policy "Allow sub_events deletes" 
  on public.sub_events for delete 
  using (true);

-- Create index for faster queries
create index if not exists idx_sub_events_event_id on public.sub_events(event_id);
create index if not exists idx_sub_events_status on public.sub_events(status);
create index if not exists idx_sub_events_published on public.sub_events(is_published);

-- =====================================================
-- CREATE SUB_EVENT_REGISTRATIONS TABLE
-- For tracking attendee registrations for specific sub-events
-- =====================================================

create table if not exists public.sub_event_registrations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  
  -- References
  sub_event_id uuid not null references public.sub_events(id) on delete cascade,
  
  -- Attendee information
  name text not null,
  email text not null,
  phone text,
  college text,
  notes text,
  
  -- Payment tracking
  payment_method text default 'offline', -- 'online', 'offline'
  payment_status text default 'not_required', -- 'paid', 'pending', 'not_required'
  payment_id text, -- Razorpay order ID or similar
  registered_at timestamptz default now(),
  
  -- Check-in and feedback (optional)
  checked_in boolean default false,
  checked_in_at timestamptz,
  rating integer, -- 1-5
  feedback text,
  
  -- Constraints
  constraint check_valid_payment_method check (payment_method in ('online', 'offline')),
  constraint check_valid_payment_status check (payment_status in ('paid', 'pending', 'not_required')),
  constraint check_valid_rating check (rating is null or (rating >= 1 and rating <= 5))
);

-- Enable RLS for sub_event_registrations
alter table public.sub_event_registrations enable row level security;

-- Public read/write access (backend will validate organizer)
create policy "Registrations are viewable and manageable" 
  on public.sub_event_registrations for select 
  using (true);

create policy "Allow registration creation" 
  on public.sub_event_registrations for insert 
  with check (true);

create policy "Allow registration updates" 
  on public.sub_event_registrations for update 
  using (true);

create policy "Allow registration deletes" 
  on public.sub_event_registrations for delete 
  using (true);

-- Create index for faster queries
create index if not exists idx_sub_event_registrations_sub_event_id on public.sub_event_registrations(sub_event_id);
create index if not exists idx_sub_event_registrations_email on public.sub_event_registrations(email);
create index if not exists idx_sub_event_registrations_payment_status on public.sub_event_registrations(payment_status);
create index if not exists idx_sub_event_registrations_payment_method on public.sub_event_registrations(payment_method);

-- Unique constraint to prevent duplicate registrations per email
create unique index if not exists idx_unique_registration_per_session on public.sub_event_registrations(sub_event_id, email);
