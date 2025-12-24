-- Fix booking_details view to include all necessary fields and use LEFT JOINs
-- This ensures bookings are visible even if bus_schedule is missing, and includes room_number/flight_number

-- DROP view first to avoid "cannot change name of view column" errors
DROP VIEW IF EXISTS public.booking_details CASCADE;

CREATE OR REPLACE VIEW public.booking_details AS
SELECT
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
  b.service_type,
  b.terminal_code,
  b.meeting_point_id,
  b.flight_number,
  b.room_number,
  b.created_at,
  b.updated_at,
  b.driver_notes,
  b.has_surfboard,
  b.surfboard_count,

  b.has_excess_baggage,
  b.excess_baggage_count,
  b.surfboard_cost,
  b.baggage_cost,
  b.total_cost,
  h.name as hotel_name,
  h.slug as hotel_slug,
  -- Use coalesce to handle missing bus_schedules
  COALESCE(bs.departure_time, ds.departure_time) as departure_time,
  COALESCE(bs.destination, 'Airport') as destination,
  ds.schedule_date,
  ds.service_type as schedule_service_type,
  ds.hotel as schedule_hotel,
  tmp.location_description as meeting_point_location,
  tmp.arrival_time_offset_min,
  tmp.arrival_time_offset_max
FROM public.bookings b
JOIN public.hotels h ON h.id = b.hotel_id
JOIN public.daily_schedules ds ON ds.id = b.daily_schedule_id
LEFT JOIN public.bus_schedules bs ON bs.id = ds.bus_schedule_id
LEFT JOIN public.terminal_meeting_points tmp ON tmp.id = b.meeting_point_id;

COMMENT ON VIEW public.booking_details IS 'Aggregated booking information with service type, terminal details, and extensive fields for ticket tracking';

-- Grant access
GRANT SELECT ON public.booking_details TO anon, authenticated, service_role;
