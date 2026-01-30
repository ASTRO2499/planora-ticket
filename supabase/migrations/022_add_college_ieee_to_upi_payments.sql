-- Add college and ieee columns to upi_payments table for data collection
ALTER TABLE public.upi_payments
ADD COLUMN IF NOT EXISTS college text,
ADD COLUMN IF NOT EXISTS ieee text;

-- Add comment to document the columns
COMMENT ON COLUMN public.upi_payments.college IS 'College or Institution name provided during UPI payment registration';
COMMENT ON COLUMN public.upi_payments.ieee IS 'IEEE membership number provided during UPI payment registration';
