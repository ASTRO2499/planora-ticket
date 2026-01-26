-- Add Google Drive URL column to upi_payments table for dual storage
ALTER TABLE public.upi_payments 
ADD COLUMN IF NOT EXISTS google_drive_url text;

-- Add comment explaining the column
COMMENT ON COLUMN public.upi_payments.google_drive_url IS 'URL to screenshot on Google Drive for backup storage';
