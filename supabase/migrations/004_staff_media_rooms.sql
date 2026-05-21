-- ============================================================
-- Migration 004: Staff accounts, media storage, room enhancements
-- Run this in Supabase SQL Editor
-- ============================================================

-- Room enhancements
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS amenities text;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Staff members
CREATE TABLE IF NOT EXISTS public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('cleaner', 'kitchen')),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage staff"
  ON public.staff_members USING (public.is_admin());
-- Allow service_role (server-side) to read for login
CREATE POLICY "Service role read" ON public.staff_members FOR SELECT USING (true);

-- Push subscriptions for guests
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid REFERENCES public.guests(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and service role" ON public.push_subscriptions USING (public.is_admin());

-- Assign cleaning to specific staff member
ALTER TABLE public.cleaning_records ADD COLUMN IF NOT EXISTS assigned_to_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL;

-- Supabase Storage bucket (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('hotel-media', 'hotel-media', true) ON CONFLICT (id) DO NOTHING;
-- CREATE POLICY "Public read hotel-media" ON storage.objects FOR SELECT USING (bucket_id = 'hotel-media');
-- CREATE POLICY "Admin upload hotel-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hotel-media');
-- CREATE POLICY "Admin delete hotel-media" ON storage.objects FOR DELETE USING (bucket_id = 'hotel-media' AND public.is_admin());
