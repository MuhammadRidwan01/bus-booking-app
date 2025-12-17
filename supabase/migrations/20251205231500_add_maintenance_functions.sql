-- Add maintenance and booking helper functions (moved from seed for robustness)
set search_path = public;

-- Drop old definitions to avoid signature conflicts on redeploy
drop function if exists public.increment_capacity(uuid, integer);
drop function if exists public.daily_maintenance();
drop function if exists public.cleanup_expired_schedules();
drop function if exists public.create_booking_with_capacity(varchar, uuid, uuid, varchar, varchar, integer);

-- Cleanup expired schedules based on Jakarta time
create or replace function public.cleanup_expired_schedules()
returns void
language plpgsql
as $function$
declare
  jakarta_date date;
  jakarta_time time;
begin
  select
    current_date at time zone 'UTC' at time zone 'Asia/Jakarta',
    current_time at time zone 'UTC' at time zone 'Asia/Jakarta'
  into jakarta_date, jakarta_time;

  update public.daily_schedules
  set status = 'expired', updated_at = now()
  where schedule_date < jakarta_date
    and status not in ('expired', 'cancelled');

  update public.daily_schedules ds
  set status = 'expired', updated_at = now()
  from public.bus_schedules bs
  where ds.bus_schedule_id = bs.id
    and ds.schedule_date = jakarta_date
    and bs.departure_time < jakarta_time
    and ds.status not in ('expired', 'cancelled');

  delete from public.daily_schedules
  where schedule_date < jakarta_date - interval '7 days'
    and status = 'expired';
end;
$function$;

-- Daily maintenance wrapper
create or replace function public.daily_maintenance()
returns void
language plpgsql
as $function$
begin
  perform public.cleanup_expired_schedules();
  perform public.generate_daily_schedules();
  raise notice 'Daily maintenance completed at %', now();
end;
$function$;

-- Increment capacity and update schedule status
create or replace function public.increment_capacity(schedule_id uuid, increment integer)
returns void
language plpgsql
as $function$
begin
  update public.daily_schedules
  set current_booked = current_booked + increment,
      status = case
        when current_booked + increment >= (
          select max_capacity from public.bus_schedules bs
          where bs.id = public.daily_schedules.bus_schedule_id
        ) then 'full'
        else 'active'
      end,
      updated_at = now()
  where id = schedule_id;
end;
$function$;

-- Create booking with capacity guard, returning booking info
create or replace function public.create_booking_with_capacity(
  p_booking_code varchar(20),
  p_hotel_id uuid,
  p_daily_schedule_id uuid,
  p_customer_name varchar(100),
  p_phone varchar(20),
  p_passenger_count integer
)
returns table(
  id uuid,
  booking_code varchar(20),
  customer_name varchar(100),
  phone varchar(20),
  passenger_count integer,
  hotel_name varchar(100),
  departure_time time,
  destination varchar(100),
  schedule_date date
) as $function$
declare
  booking_id uuid;
  current_capacity integer;
  max_cap integer;
  schedule_status varchar(20);
begin
  select ds.current_booked, bs.max_capacity, ds.status
  into current_capacity, max_cap, schedule_status
  from public.daily_schedules ds
  join public.bus_schedules bs on ds.bus_schedule_id = bs.id
  where ds.id = p_daily_schedule_id;

  if schedule_status != 'active' then
    raise exception 'Jadwal tidak tersedia. Status: %', schedule_status;
  end if;

  if current_capacity + p_passenger_count > max_cap then
    raise exception 'Kapasitas tidak mencukupi. Tersisa: %', (max_cap - current_capacity);
  end if;

  insert into public.bookings (booking_code, hotel_id, daily_schedule_id, customer_name, phone, passenger_count)
  values (p_booking_code, p_hotel_id, p_daily_schedule_id, p_customer_name, p_phone, p_passenger_count)
  returning public.bookings.id into booking_id;

  perform public.increment_capacity(p_daily_schedule_id, p_passenger_count);

  return query
  select
    b.id,
    b.booking_code,
    b.customer_name,
    b.phone,
    b.passenger_count,
    h.name as hotel_name,
    bs.departure_time,
    bs.destination,
    ds.schedule_date
  from public.bookings b
  join public.hotels h on b.hotel_id = h.id
  join public.daily_schedules ds on b.daily_schedule_id = ds.id
  join public.bus_schedules bs on ds.bus_schedule_id = bs.id
  where b.id = booking_id;
end;
$function$ language plpgsql;
