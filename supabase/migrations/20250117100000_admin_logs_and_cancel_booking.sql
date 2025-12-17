-- Admin logs table for auditing admin actions
create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

comment on table public.admin_logs is 'Simple audit log for admin actions';

-- RPC: cancel booking and release capacity if schedule not past
create or replace function public.cancel_booking_and_release_capacity(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_schedule_date date;
  v_departure_time time;
  v_now timestamptz;
  v_departure timestamptz;
begin
  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  select ds.schedule_date, bs.departure_time
  into v_schedule_date, v_departure_time
  from public.daily_schedules ds
  join public.bus_schedules bs on bs.id = ds.bus_schedule_id
  where ds.id = v_booking.daily_schedule_id;

  if v_schedule_date is null or v_departure_time is null then
    raise exception 'Schedule not found for booking';
  end if;

  v_now := timezone('Asia/Jakarta', now());
  v_departure := (v_schedule_date + v_departure_time)::timestamp at time zone 'Asia/Jakarta';

  if v_departure < v_now then
    raise exception 'Tidak bisa membatalkan jadwal yang sudah lewat';
  end if;

  if v_booking.status = 'cancelled' then
    return v_booking;
  end if;

  update public.bookings
  set status = 'cancelled', updated_at = now()
  where id = p_booking_id
  returning * into v_booking;

  update public.daily_schedules
  set current_booked = greatest(current_booked - v_booking.passenger_count, 0),
      updated_at = now()
  where id = v_booking.daily_schedule_id;

  return v_booking;
end;
$$;
