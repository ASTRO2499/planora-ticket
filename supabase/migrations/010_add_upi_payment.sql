-- =====================================================
-- UPI PAYMENT SYSTEM MIGRATION
-- =====================================================

-- Add UPI settings columns to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS upi_enabled boolean default false,
ADD COLUMN IF NOT EXISTS upi_id text;

-- Add UPI payment status columns to tickets table
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS payment_method text default 'razorpay', -- 'razorpay' or 'upi'
ADD COLUMN IF NOT EXISTS upi_payment_status text default 'pending', -- 'pending', 'verified', 'rejected'
ADD COLUMN IF NOT EXISTS upi_screenshot_url text;

-- Create UPI payment records table
CREATE TABLE IF NOT EXISTS public.upi_payments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  
  -- Event reference
  event_id text not null,
  
  -- Ticket reference
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  
  -- User details
  name text not null,
  email text not null,
  phone text,
  
  -- Payment details
  amount_inr integer not null,
  upi_id text not null,
  transaction_id text,
  screenshot_url text,
  
  -- Status tracking
  status text default 'pending', -- 'pending', 'verified', 'rejected'
  verified_by text, -- Organizer/admin who verified
  verified_at timestamptz,
  rejection_reason text,
  
  -- Metadata
  payment_notes text
);

-- Enable RLS for UPI payments
ALTER TABLE public.upi_payments ENABLE ROW LEVEL SECURITY;

-- Public read access (for verification)
CREATE POLICY "Allow read upi_payments"
  ON public.upi_payments FOR SELECT
  USING (true);

-- Allow inserts
CREATE POLICY "Allow insert upi_payments"
  ON public.upi_payments FOR INSERT
  WITH CHECK (true);

-- Allow updates
CREATE POLICY "Allow update upi_payments"
  ON public.upi_payments FOR UPDATE
  USING (true);

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('upi-screenshots', 'upi-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for upi-screenshots bucket
CREATE POLICY "Public can view upi screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'upi-screenshots');

CREATE POLICY "Anyone can upload upi screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'upi-screenshots');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_upi_payments_event_id ON public.upi_payments(event_id);
CREATE INDEX IF NOT EXISTS idx_upi_payments_ticket_id ON public.upi_payments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_upi_payments_email ON public.upi_payments(email);
CREATE INDEX IF NOT EXISTS idx_upi_payments_status ON public.upi_payments(status);
CREATE INDEX IF NOT EXISTS idx_tickets_payment_method ON public.tickets(payment_method);
CREATE INDEX IF NOT EXISTS idx_tickets_upi_status ON public.tickets(upi_payment_status);
