-- ============================================================
-- Migration 005: TV lifecycle — stays, themes, TV sessions
-- Run this in Supabase SQL Editor
-- ============================================================

-- TV / theme columns on rooms
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS theme_name text;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS theme_type text DEFAULT 'classic';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS theme_description text;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS theme_video_url text;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS theme_video_duration_seconds integer DEFAULT 120;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS tv_background_url text;

-- Hotel settings: checkout time
ALTER TABLE public.hotel_settings ADD COLUMN IF NOT EXISTS checkout_time time DEFAULT '12:00:00';

-- Stays: primary check-in record driving TV state machine
CREATE TABLE IF NOT EXISTS public.stays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL,
  check_in timestamptz NOT NULL DEFAULT now(),
  check_out_scheduled date NOT NULL,
  checked_out_at timestamptz,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'checked_out')),
  tv_state text NOT NULL DEFAULT 'welcome'
    CHECK (tv_state IN ('idle', 'welcome', 'intro_video', 'guest_panel', 'checkout_message', 'session_closing')),
  tv_state_updated_at timestamptz NOT NULL DEFAULT now(),
  access_token text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage stays"
  ON public.stays USING (public.is_admin());
CREATE POLICY "Service role read stays"
  ON public.stays FOR SELECT USING (true);

-- Stay guests: all guests registered in the room for this stay
CREATE TABLE IF NOT EXISTS public.stay_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stay_id uuid NOT NULL REFERENCES public.stays(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stay_guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage stay_guests"
  ON public.stay_guests USING (public.is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stays_room_status ON public.stays(room_id, status);
CREATE INDEX IF NOT EXISTS idx_stays_access_token ON public.stays(access_token);
CREATE INDEX IF NOT EXISTS idx_stay_guests_stay_id ON public.stay_guests(stay_id);
