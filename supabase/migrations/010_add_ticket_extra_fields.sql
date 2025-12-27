-- Add five optional extra fields to tickets for organizer-defined inputs
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS extra1 TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS extra2 TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS extra3 TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS extra4 TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS extra5 TEXT;
