-- Recreate sub_event_registrations table with all fields including extra columns for form editing
DROP TABLE IF EXISTS sub_event_registrations CASCADE;

CREATE TABLE public.sub_event_registrations (
  -- Core tracking
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Relationships
  sub_event_id UUID NOT NULL REFERENCES sub_events(id) ON DELETE CASCADE,
  
  -- Attendee Information (core form fields)
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  college TEXT,
  notes TEXT,
  
  -- Payment Information
  payment_method TEXT DEFAULT 'offline' NOT NULL CHECK (payment_method IN ('online', 'offline')),
  payment_status TEXT DEFAULT 'not_required' NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'not_required')),
  payment_id TEXT,
  
  -- Attendance Tracking
  registered_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  
  -- Feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  
  -- ===== EXTRA 5 COLUMNS FOR FORM EDITING =====
  -- Edit tracking
  edit_count INTEGER DEFAULT 0 NOT NULL,
  last_edited_at TIMESTAMPTZ,
  
  -- Form state management
  is_draft BOOLEAN DEFAULT false NOT NULL,
  submission_status TEXT DEFAULT 'submitted' NOT NULL CHECK (submission_status IN ('draft', 'submitted', 'confirmed')),
  
  -- Version control for form changes
  form_version INTEGER DEFAULT 1 NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_registration UNIQUE(sub_event_id, email),
  CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Indexes for common queries
CREATE INDEX idx_sub_event_registrations_sub_event_id ON public.sub_event_registrations(sub_event_id);
CREATE INDEX idx_sub_event_registrations_email ON public.sub_event_registrations(email);
CREATE INDEX idx_sub_event_registrations_payment_status ON public.sub_event_registrations(payment_status);
CREATE INDEX idx_sub_event_registrations_is_draft ON public.sub_event_registrations(is_draft);
CREATE INDEX idx_sub_event_registrations_last_edited ON public.sub_event_registrations(last_edited_at);
CREATE INDEX idx_sub_event_registrations_created_at ON public.sub_event_registrations(created_at DESC);

-- Insert sample data for testing
INSERT INTO public.sub_event_registrations (
  sub_event_id, name, email, phone, college, notes, 
  payment_method, payment_status, 
  registered_at, checked_in,
  rating, feedback,
  edit_count, is_draft, submission_status, form_version
) 
SELECT 
  id, 
  'John Doe', 
  'john@example.com', 
  '+91 98765 43210', 
  'MIT', 
  'No special requirements',
  'online',
  'completed',
  now() - interval '2 days',
  true,
  5,
  'Great session!',
  0,
  false,
  'submitted',
  1
FROM sub_events 
LIMIT 1;

INSERT INTO public.sub_event_registrations (
  sub_event_id, name, email, phone, college, notes, 
  payment_method, payment_status, 
  registered_at, checked_in,
  rating,
  edit_count, is_draft, submission_status, form_version
) 
SELECT 
  id, 
  'Jane Smith', 
  'jane@example.com', 
  '+91 87654 32109', 
  'Stanford', 
  'Vegetarian meal required',
  'offline',
  'not_required',
  now() - interval '1 day',
  false,
  null,
  1,
  false,
  'submitted',
  1
FROM sub_events 
LIMIT 1 OFFSET 1;

INSERT INTO public.sub_event_registrations (
  sub_event_id, name, email, phone, college, notes, 
  payment_method, payment_status, 
  registered_at,
  edit_count, last_edited_at, is_draft, submission_status, form_version
) 
SELECT 
  id, 
  'Bob Wilson', 
  'bob@example.com', 
  '+91 76543 21098', 
  'Harvard', 
  'Work in progress',
  'online',
  'pending',
  now() - interval '6 hours',
  2,
  now() - interval '30 minutes',
  true,
  'draft',
  2
FROM sub_events 
LIMIT 1 OFFSET 2;
