-- Add contact fields to tickets
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS college TEXT,
  ADD COLUMN IF NOT EXISTS ieee TEXT;
