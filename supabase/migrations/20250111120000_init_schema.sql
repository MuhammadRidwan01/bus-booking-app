-- Ensure required extensions -------------------------------------------------
create extension if not exists "pgcrypto";

-- Custom enum types ----------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type public.booking_status as enum ('confirmed', 'cancelled');
  end if;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'schedule_status') then
    create type public.schedule_status as enum ('active', 'full', 'expired', 'cancelled');
  end if;
end;
$$;

-- Helper function to keep updated_at in sync ---------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Hotels ---------------------------------------------------------------------
create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger hotels_set_updated_at
before update on public.hotels
for each row
execute function public.handle_updated_at();

-- Bus schedules --------------------------------------------------------------
create table public.bus_schedules (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  departure_time time not null,
  destination text not null,
  max_capacity integer not null check (max_capacity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hotel_id, departure_time, destination)
);

create index bus_schedules_hotel_id_idx on public.bus_schedules (hotel_id);
create index bus_schedules_hotel_active_idx on public.bus_schedules (hotel_id, is_active);

create trigger bus_schedules_set_updated_at
before update on public.bus_schedules
for each row
execute function public.handle_updated_at();

-- Daily schedules ------------------------------------------------------------
create table public.daily_schedules (
  id uuid primary key default gen_random_uuid(),
  bus_schedule_id uuid not null references public.bus_schedules(id) on delete cascade,
  schedule_date date not null,
  current_booked integer not null default 0 check (current_booked >= 0),
  status public.schedule_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bus_schedule_id, schedule_date)
);

create index daily_schedules_bus_schedule_id_idx on public.daily_schedules (bus_schedule_id);
create index daily_schedules_schedule_date_idx on public.daily_schedules (schedule_date);
create index daily_schedules_status_idx on public.daily_schedules (status);

create trigger daily_schedules_set_updated_at
before update on public.daily_schedules
for each row
execute function public.handle_updated_at();

-- Bookings -------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_code text not null unique,
  hotel_id uuid not null references public.hotels(id),
  daily_schedule_id uuid not null references public.daily_schedules(id),
  customer_name text not null,
  phone text not null,
  passenger_count integer not null check (passenger_count > 0 and passenger_count <= 5),
  status public.booking_status not null default 'confirmed',
  whatsapp_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_daily_schedule_idx on public.bookings (daily_schedule_id);

create trigger bookings_set_updated_at
before update on public.bookings
for each row
execute function public.handle_updated_at();

-- Booking details view -------------------------------------------------------
create or replace view public.booking_details as
select
  b.id,
  b.booking_code,
  b.hotel_id,
  b.daily_schedule_id,
  b.customer_name,
  b.phone,
  b.passenger_count,
  b.status,
  b.whatsapp_sent,
  b.created_at,
  b.updated_at,
  h.name as hotel_name,
  bs.departure_time,
  bs.destination,
  ds.schedule_date
from public.bookings b
join public.hotels h on h.id = b.hotel_id
join public.daily_schedules ds on ds.id = b.daily_schedule_id
join public.bus_schedules bs on bs.id = ds.bus_schedule_id;

comment on view public.booking_details is 'Aggregated booking information for ticket tracking.';

-- Capacity helpers -----------------------------------------------------------
create or replace function public.sync_daily_schedule_status()
returns trigger
language plpgsql
as $$
declare
  target_capacity integer;
begin
  if new.status in ('cancelled', 'expired') then
    return new;
  end if;

  select max_capacity
  into target_capacity
  from public.bus_schedules
  where id = new.bus_schedule_id;

  if target_capacity is null then
    return new;
  end if;

  if new.current_booked >= target_capacity then
    new.status := 'full';
  else
    new.status := 'active';
  end if;

  return new;
end;
$$;

drop trigger if exists daily_schedules_sync_status on public.daily_schedules;

create trigger daily_schedules_sync_status
before insert or update of current_booked on public.daily_schedules
for each row
execute function public.sync_daily_schedule_status();

create or replace function public.increment_capacity(schedule_id uuid, increment integer)
returns public.daily_schedules
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.daily_schedules;
begin
  if increment <= 0 then
    raise exception 'Increment must be greater than zero';
  end if;

  update public.daily_schedules ds
  set current_booked = ds.current_booked + increment
  from public.bus_schedules bs
  where ds.id = schedule_id
    and bs.id = ds.bus_schedule_id
    and ds.current_booked + increment <= bs.max_capacity
  returning ds.* into updated_row;

  if not found then
    raise exception 'Unable to increment capacity: schedule not found or capacity exceeded';
  end if;

  return updated_row;
end;
$$;

-- Row level security & grants ------------------------------------------------
alter table public.hotels enable row level security;
alter table public.bus_schedules enable row level security;
alter table public.daily_schedules enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.hotels to anon, authenticated;
grant select on public.bus_schedules to anon, authenticated;
grant select on public.daily_schedules to anon, authenticated;
grant select on public.booking_details to anon, authenticated;

drop policy if exists "Public read active hotels" on public.hotels;
create policy "Public read active hotels"
  on public.hotels
  for select
  using (is_active);

drop policy if exists "Public read active bus schedules" on public.bus_schedules;
create policy "Public read active bus schedules"
  on public.bus_schedules
  for select
  using (is_active);

drop policy if exists "Public read active or full daily schedules" on public.daily_schedules;
create policy "Public read active or full daily schedules"
  on public.daily_schedules
  for select
  using (status in ('active', 'full'));

-- Realtime configuration -----------------------------------------------------
alter table public.daily_schedules replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'daily_schedules'
  ) then
    alter publication supabase_realtime add table public.daily_schedules;
  end if;
end;
$$;
