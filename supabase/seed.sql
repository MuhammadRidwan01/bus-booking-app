-- Seed hotels ----------------------------------------------------------------
insert into public.hotels (name, slug, is_active)
values
  ('Ibis Style', 'ibis-style', true),
  ('Ibis Budget', 'ibis-budget', true)
on conflict (slug) do update
set name = excluded.name,
    is_active = excluded.is_active;

-- Seed bus schedules ---------------------------------------------------------
with hotel_map as (
  select id, slug
  from public.hotels
  where slug in ('ibis-style', 'ibis-budget')
),
routes as (
  select *
  from (values
    ('ibis-style', '06:00', 'Bandara Soekarno-Hatta', 15),
    ('ibis-style', '10:00', 'AEON Mall BSD', 15),
    ('ibis-style', '14:00', 'Bandara Soekarno-Hatta', 15),
    ('ibis-budget', '07:00', 'Bandara Soekarno-Hatta', 15),
    ('ibis-budget', '11:00', 'Summarecon Mall Serpong', 15),
    ('ibis-budget', '15:00', 'Bandara Soekarno-Hatta', 15)
  ) as r(slug, departure_time, destination, max_capacity)
)
insert into public.bus_schedules (hotel_id, departure_time, destination, max_capacity, is_active)
select
  hm.id,
  routes.departure_time::time,
  routes.destination,
  routes.max_capacity,
  true
from hotel_map hm
join routes on routes.slug = hm.slug
on conflict (hotel_id, departure_time, destination) do update
set max_capacity = excluded.max_capacity,
    is_active = true;

-- Seed daily schedules -------------------------------------------------------
with schedules as (
  select bs.id, h.slug, bs.departure_time
  from public.bus_schedules bs
  join public.hotels h on h.id = bs.hotel_id
),
dates as (
  select current_date::date as schedule_date, 'today'::text as label
  union all
  select (current_date + interval '1 day')::date, 'tomorrow'
)
insert into public.daily_schedules (bus_schedule_id, schedule_date, current_booked, status)
select
  s.id,
  d.schedule_date,
  case
    when d.label = 'today' and s.slug = 'ibis-style' and s.departure_time = '10:00'::time then 12
    when d.label = 'today' and s.slug = 'ibis-style' and s.departure_time = '14:00'::time then 15
    when d.label = 'today' and s.slug = 'ibis-budget' and s.departure_time = '15:00'::time then 9
    else 0
  end,
  'active'::public.schedule_status
from schedules s
cross join dates d
on conflict (bus_schedule_id, schedule_date) do update
set current_booked = excluded.current_booked,
    status = excluded.status;
