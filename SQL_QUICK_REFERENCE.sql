-- =====================================================
-- QUICK SQL REFERENCE FOR SUB-EVENTS FEATURE
-- Copy and paste directly into Supabase SQL Editor
-- =====================================================

-- 1. CREATE SUB_EVENTS TABLE
create table if not exists public.sub_events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  event_id text not null references public.events(id) on delete cascade,
  title text not null,
  description text,
  type text not null,
  start_time timestamptz,
  end_time timestamptz,
  location text,
  max_capacity integer,
  current_registrations integer default 0,
  speaker_name text,
  speaker_email text,
  speaker_bio text,
  image_url text,
  status text default 'active',
  is_published boolean default true,
  metadata jsonb default '{}'::jsonb
);

-- 2. ENABLE RLS FOR SUB_EVENTS
alter table public.sub_events enable row level security;

-- 3. CREATE RLS POLICIES FOR SUB_EVENTS
create policy "Published sub_events are viewable by everyone" 
  on public.sub_events for select using (is_published = true);

create policy "Anyone can create sub_events" 
  on public.sub_events for insert with check (true);

create policy "Allow sub_events updates" 
  on public.sub_events for update using (true);

create policy "Allow sub_events deletes" 
  on public.sub_events for delete using (true);

-- 4. CREATE INDEXES FOR SUB_EVENTS
create index if not exists idx_sub_events_event_id on public.sub_events(event_id);
create index if not exists idx_sub_events_status on public.sub_events(status);
create index if not exists idx_sub_events_published on public.sub_events(is_published);

-- 5. CREATE SUB_EVENT_REGISTRATIONS TABLE
create table if not exists public.sub_event_registrations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  sub_event_id uuid not null references public.sub_events(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  status text default 'registered',
  attended_at timestamptz,
  checked_in_at timestamptz,
  rating integer,
  feedback text,
  unique(sub_event_id, ticket_id)
);

-- 6. ENABLE RLS FOR SUB_EVENT_REGISTRATIONS
alter table public.sub_event_registrations enable row level security;

-- 7. CREATE RLS POLICIES FOR SUB_EVENT_REGISTRATIONS
create policy "Registrations are viewable and manageable" 
  on public.sub_event_registrations for select using (true);

create policy "Allow registration creation" 
  on public.sub_event_registrations for insert with check (true);

create policy "Allow registration updates" 
  on public.sub_event_registrations for update using (true);

create policy "Allow registration deletes" 
  on public.sub_event_registrations for delete using (true);

-- 8. CREATE INDEXES FOR SUB_EVENT_REGISTRATIONS
create index if not exists idx_sub_event_registrations_sub_event_id on public.sub_event_registrations(sub_event_id);
create index if not exists idx_sub_event_registrations_ticket_id on public.sub_event_registrations(ticket_id);
create index if not exists idx_sub_event_registrations_status on public.sub_event_registrations(status);

-- =====================================================
-- VERIFY TABLES WERE CREATED
-- Run these SELECT queries to verify
-- =====================================================

-- Check sub_events table
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'sub_events';

-- Check sub_event_registrations table
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'sub_event_registrations';

-- Get count of sub_events
SELECT COUNT(*) as sub_events_count FROM public.sub_events;

-- Get count of sub_event_registrations
SELECT COUNT(*) as registrations_count FROM public.sub_event_registrations;

-- =====================================================
-- SAMPLE DATA INSERTION (for testing)
-- =====================================================

-- First get an event_id (replace with your actual event ID)
-- SELECT id FROM public.events LIMIT 1;

-- Then insert a sample sub-event (replace event_id)
INSERT INTO public.sub_events (
  event_id,
  title,
  type,
  description,
  start_time,
  end_time,
  location,
  max_capacity,
  speaker_name,
  speaker_email,
  is_published
) VALUES (
  'your-event-id-here',
  'AI Workshop',
  'workshop',
  'Learn artificial intelligence basics with hands-on examples',
  '2024-01-15T10:00:00Z',
  '2024-01-15T12:00:00Z',
  'Room 101',
  30,
  'Dr. Jane Smith',
  'jane.smith@example.com',
  true
);

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get all sub-events for a specific event
SELECT * FROM public.sub_events 
WHERE event_id = 'your-event-id' 
ORDER BY start_time ASC;

-- Get active sub-events
SELECT * FROM public.sub_events 
WHERE status = 'active' AND is_published = true
ORDER BY start_time ASC;

-- Get sub-events with registration count
SELECT 
  id,
  title,
  type,
  start_time,
  max_capacity,
  current_registrations,
  (max_capacity - current_registrations) as available_spots
FROM public.sub_events
WHERE event_id = 'your-event-id'
ORDER BY start_time ASC;

-- Get registrations for a specific sub-event
SELECT 
  r.*,
  t.name,
  t.email
FROM public.sub_event_registrations r
JOIN public.tickets t ON r.ticket_id = t.id
WHERE r.sub_event_id = 'sub-event-uuid'
ORDER BY r.created_at DESC;

-- Get all sub-events attended by a specific person
SELECT 
  s.*
FROM public.sub_events s
JOIN public.sub_event_registrations r ON s.id = r.sub_event_id
WHERE r.ticket_id = 'ticket-uuid'
ORDER BY s.start_time ASC;

-- =====================================================
-- CLEANUP (if needed to remove tables)
-- =====================================================

-- DROP TABLE IF EXISTS public.sub_event_registrations CASCADE;
-- DROP TABLE IF EXISTS public.sub_events CASCADE;
