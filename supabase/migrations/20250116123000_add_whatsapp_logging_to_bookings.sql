-- Add WhatsApp logging fields to bookings
alter table public.bookings
  add column if not exists whatsapp_sent boolean not null default false,
  add column if not exists whatsapp_attempts integer not null default 0,
  add column if not exists whatsapp_last_error text;

alter table public.bookings
  alter column whatsapp_sent set default false;

drop view if exists public.booking_details;

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
  b.whatsapp_attempts,
  b.whatsapp_last_error,
  b.created_at,
  b.updated_at,
  h.name as hotel_name,
  h.slug as hotel_slug,
  bs.departure_time,
  bs.destination,
  ds.schedule_date
from public.bookings b
join public.hotels h on h.id = b.hotel_id
join public.daily_schedules ds on ds.id = b.daily_schedule_id
join public.bus_schedules bs on bs.id = ds.bus_schedule_id;
