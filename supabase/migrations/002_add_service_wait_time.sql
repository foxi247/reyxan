-- Add estimated wait time per service (run in Supabase SQL editor)
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS estimated_wait_minutes integer NOT NULL DEFAULT 30;
