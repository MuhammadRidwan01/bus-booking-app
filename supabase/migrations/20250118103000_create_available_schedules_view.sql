-- Create view available_schedules for admin/API consumption
create or replace view public.available_schedules as
select 
  ds.id as daily_schedule_id,
  h.id as hotel_id,
  h.name as hotel_name,
  h.slug as hotel_slug,
  bs.departure_time,
  bs.destination,
  ds.schedule_date,
  ds.current_booked,
  bs.max_capacity,
  (bs.max_capacity - ds.current_booked) as available_seats,
  ds.status
from public.daily_schedules ds
join public.bus_schedules bs on ds.bus_schedule_id = bs.id
join public.hotels h on bs.hotel_id = h.id
where h.is_active = true
  and bs.is_active = true;

comment on view public.available_schedules is 'Aggregated active schedules with availability information.';
