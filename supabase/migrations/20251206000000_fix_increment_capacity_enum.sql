-- Fix increment_capacity to use schedule_status enum (prevents text cast errors)
set search_path = public;

drop function if exists public.increment_capacity(uuid, integer);

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
        ) then 'full'::public.schedule_status
        else 'active'::public.schedule_status
      end,
      updated_at = now()
  where id = schedule_id;
end;
$function$;
