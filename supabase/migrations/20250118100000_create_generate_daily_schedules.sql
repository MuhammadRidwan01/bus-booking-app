-- Ensure generate_daily_schedules function exists for RPC
create or replace function public.generate_daily_schedules()
returns void
language plpgsql
set search_path = public
as $$
declare
  jakarta_date date;
begin
  -- current date in Jakarta timezone
  select current_date at time zone 'UTC' at time zone 'Asia/Jakarta' into jakarta_date;

  -- today
  insert into public.daily_schedules (bus_schedule_id, schedule_date, current_booked, status)
  select bs.id, jakarta_date, 0, 'active'
  from public.bus_schedules bs
  where bs.is_active = true
  on conflict (bus_schedule_id, schedule_date) do nothing;

  -- tomorrow
  insert into public.daily_schedules (bus_schedule_id, schedule_date, current_booked, status)
  select bs.id, jakarta_date + interval '1 day', 0, 'active'
  from public.bus_schedules bs
  where bs.is_active = true
  on conflict (bus_schedule_id, schedule_date) do nothing;

  -- day after tomorrow
  insert into public.daily_schedules (bus_schedule_id, schedule_date, current_booked, status)
  select bs.id, jakarta_date + interval '2 day', 0, 'active'
  from public.bus_schedules bs
  where bs.is_active = true
  on conflict (bus_schedule_id, schedule_date) do nothing;
end;
$$;
