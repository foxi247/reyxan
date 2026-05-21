-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Cleaning records (housekeeping schedule)
CREATE TABLE IF NOT EXISTS public.cleaning_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'done', 'skipped')),
  notes text,
  scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cleaning_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage cleaning records"
  ON public.cleaning_records USING (public.is_admin());

-- Guest stay ratings
CREATE TABLE IF NOT EXISTS public.guest_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.guest_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can view ratings"
  ON public.guest_ratings FOR SELECT USING (public.is_admin());
CREATE POLICY "Anyone can submit rating"
  ON public.guest_ratings FOR INSERT WITH CHECK (true);

-- Pre-bookings (advance reservations before arrival)
CREATE TABLE IF NOT EXISTS public.pre_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  email text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  room_preference text,
  notes text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'arrived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pre_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage pre-bookings"
  ON public.pre_bookings USING (public.is_admin());
CREATE POLICY "Anyone can submit pre-booking"
  ON public.pre_bookings FOR INSERT WITH CHECK (true);

-- Staff assignment on service requests
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS assigned_to text;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.cleaning_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pre_bookings;
