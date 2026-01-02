-- Add track coming soon toggle per event
ALTER TABLE public.events
DROP COLUMN IF EXISTS track_coming_soon;

ALTER TABLE public.events
ADD COLUMN track_coming_soon boolean NOT NULL DEFAULT false;
