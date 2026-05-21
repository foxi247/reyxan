-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  role text not null check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

-- Rooms
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  number text unique not null,
  floor int,
  status text not null default 'available' check (status in ('available', 'occupied', 'maintenance')),
  created_at timestamptz not null default now()
);

-- Guests
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  room_id uuid references public.rooms(id) on delete set null,
  check_in date not null,
  check_out date not null,
  status text not null default 'active' check (status in ('active', 'expired', 'blocked', 'checked_out')),
  access_token_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Guest access requests
create table public.guest_access_requests (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  guest_id uuid references public.guests(id) on delete set null,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Services
create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text not null,
  action_type text not null check (action_type in ('chat', 'request', 'page', 'link')),
  action_value text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Service requests
create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  title text not null,
  message text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'done', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chat threads
create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'archived')),
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

-- Chat messages
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_type text not null check (sender_type in ('guest', 'admin')),
  sender_id uuid,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Menu categories
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- Menu items
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

-- Room service orders
create table public.room_service_orders (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  status text not null default 'new' check (status in ('new', 'preparing', 'delivering', 'delivered', 'cancelled')),
  total numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Room service order items
create table public.room_service_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.room_service_orders(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id),
  quantity int not null default 1 check (quantity > 0),
  price numeric not null check (price >= 0)
);

-- Hotel settings
create table public.hotel_settings (
  id uuid primary key default gen_random_uuid(),
  hotel_name text not null default 'Отель Рейхан',
  reception_phone text,
  admin_email text,
  wifi_name text,
  wifi_password text,
  food_delivery_hours text not null default '07:00–23:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_guests_status on public.guests(status);
create index idx_guests_phone on public.guests(phone);
create index idx_guest_access_requests_status on public.guest_access_requests(status);
create index idx_service_requests_status on public.service_requests(status);
create index idx_chat_messages_thread on public.chat_messages(thread_id, created_at);
create index idx_room_service_orders_status on public.room_service_orders(status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.guest_access_requests enable row level security;
alter table public.guests enable row level security;
alter table public.rooms enable row level security;
alter table public.services enable row level security;
alter table public.service_requests enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.room_service_orders enable row level security;
alter table public.room_service_order_items enable row level security;
alter table public.hotel_settings enable row level security;

-- Helper function: check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Profiles: admin can read all, user can read own
create policy "Admin can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "User can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admin can insert profiles"
  on public.profiles for insert
  with check (public.is_admin());

create policy "Admin can update profiles"
  on public.profiles for update
  using (public.is_admin());

-- guest_access_requests: public insert (pending only), admin all
create policy "Anyone can submit pending request"
  on public.guest_access_requests for insert
  with check (status = 'pending');

create policy "Admin can view all requests"
  on public.guest_access_requests for select
  using (public.is_admin());

create policy "Admin can update requests"
  on public.guest_access_requests for update
  using (public.is_admin());

-- Guests: admin only
create policy "Admin can manage guests"
  on public.guests for all
  using (public.is_admin());

-- Rooms: admin all, public read available
create policy "Admin can manage rooms"
  on public.rooms for all
  using (public.is_admin());

create policy "Public can read rooms"
  on public.rooms for select
  using (true);

-- Services: admin all, public read active
create policy "Admin can manage services"
  on public.services for all
  using (public.is_admin());

create policy "Public can read active services"
  on public.services for select
  using (is_active = true);

-- Service requests: admin all (guests use server actions)
create policy "Admin can manage service requests"
  on public.service_requests for all
  using (public.is_admin());

-- Chat threads: admin all
create policy "Admin can manage chat threads"
  on public.chat_threads for all
  using (public.is_admin());

-- Chat messages: admin all
create policy "Admin can manage chat messages"
  on public.chat_messages for all
  using (public.is_admin());

-- Menu: admin all, public read active
create policy "Admin can manage menu categories"
  on public.menu_categories for all
  using (public.is_admin());

create policy "Public can read active categories"
  on public.menu_categories for select
  using (is_active = true);

create policy "Admin can manage menu items"
  on public.menu_items for all
  using (public.is_admin());

create policy "Public can read available items"
  on public.menu_items for select
  using (is_available = true);

-- Orders: admin all
create policy "Admin can manage orders"
  on public.room_service_orders for all
  using (public.is_admin());

create policy "Admin can manage order items"
  on public.room_service_order_items for all
  using (public.is_admin());

-- Hotel settings: admin all
create policy "Admin can manage hotel settings"
  on public.hotel_settings for all
  using (public.is_admin());

create policy "Public can read hotel settings"
  on public.hotel_settings for select
  using (true);

-- ============================================================
-- REALTIME
-- ============================================================

alter publication supabase_realtime add table public.guest_access_requests;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.service_requests;
alter publication supabase_realtime add table public.room_service_orders;
