-- Update Database Functions and Views
-- This migration updates existing views and creates new RPC functions
-- to support the schedule management system with service types

-- Drop and recreate booking_details view with service type and terminal information
DROP VIEW IF EXISTS public.booking_details;

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
  b.service_type,
  b.terminal_code,
  b.meeting_point_id,
  b.created_at,
  b.updated_at,
  h.name as hotel_name,
  -- Handle both old bus_schedules and new daily_schedules structure
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

COMMENT ON VIEW public.booking_details IS 'Aggregated booking information with service type and terminal details for ticket tracking';

-- Create RPC function for advance booking validation
CREATE OR REPLACE FUNCTION public.validate_advance_booking(
  departure_date DATE,
  departure_time TIME,
  timezone_name TEXT DEFAULT 'Asia/Jakarta'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  departure_datetime TIMESTAMPTZ;
  current_datetime TIMESTAMPTZ;
  min_advance_hours INTEGER := 24; -- Minimum 24 hours advance booking
BEGIN
  -- Combine date and time into a timestamptz in the specified timezone
  departure_datetime := (departure_date || ' ' || departure_time)::TIMESTAMP AT TIME ZONE timezone_name;
  
  -- Get current time in the specified timezone
  current_datetime := NOW() AT TIME ZONE timezone_name;
  
  -- Check if departure is at least min_advance_hours from now
  RETURN departure_datetime >= (current_datetime + (min_advance_hours || ' hours')::INTERVAL);
END;
$$;

COMMENT ON FUNCTION public.validate_advance_booking IS 'Validates that a booking is made with minimum advance notice (24 hours)';

-- Create or update available_schedules view to filter by service type
DROP VIEW IF EXISTS public.available_schedules;

CREATE OR REPLACE VIEW public.available_schedules AS
SELECT
  ds.id,
  ds.schedule_date,
  ds.departure_time,
  ds.capacity,
  ds.current_booked as current_bookings,
  ds.status,
  ds.service_type,
  ds.hotel,
  ds.is_active,
  h.name as hotel_name,
  h.slug as hotel_slug,
  (ds.capacity - ds.current_booked) as available_spots,
  CASE
    WHEN ds.current_booked >= ds.capacity THEN 'full'
    WHEN ds.current_booked >= (ds.capacity * 0.8) THEN 'almost_full'
    ELSE 'available'
  END as availability_status,
  -- Check if booking meets advance requirement
  public.validate_advance_booking(ds.schedule_date, ds.departure_time) as meets_advance_requirement
FROM public.daily_schedules ds
JOIN public.hotels h ON h.slug = ds.hotel
WHERE ds.is_active = true
  AND ds.status IN ('active', 'full')
  AND ds.schedule_date >= CURRENT_DATE;

COMMENT ON VIEW public.available_schedules IS 'Available schedules with service type filtering and advance booking validation';

-- Create RPC function to get available schedules by service type
CREATE OR REPLACE FUNCTION public.get_available_schedules(
  service_type_param TEXT,
  hotel_param TEXT,
  schedule_date_param DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  schedule_date DATE,
  departure_time TIME,
  capacity INTEGER,
  current_bookings INTEGER,
  available_spots INTEGER,
  status schedule_status,
  service_type VARCHAR(20),
  hotel VARCHAR(50),
  hotel_name TEXT,
  hotel_slug TEXT,
  availability_status TEXT,
  meets_advance_requirement BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    avs.id,
    avs.schedule_date,
    avs.departure_time,
    avs.capacity,
    avs.current_bookings,
    avs.available_spots,
    avs.status,
    avs.service_type,
    avs.hotel,
    avs.hotel_name,
    avs.hotel_slug,
    avs.availability_status,
    avs.meets_advance_requirement
  FROM public.available_schedules avs
  WHERE avs.service_type = service_type_param
    AND avs.hotel = hotel_param
    AND (schedule_date_param IS NULL OR avs.schedule_date = schedule_date_param)
    AND avs.meets_advance_requirement = true
  ORDER BY avs.schedule_date, avs.departure_time;
END;
$$;

COMMENT ON FUNCTION public.get_available_schedules IS 'Gets available schedules filtered by service type and hotel with advance booking validation';

-- Update increment_capacity function to work with new daily_schedules structure
CREATE OR REPLACE FUNCTION public.increment_schedule_capacity(
  schedule_id UUID,
  increment INTEGER
)
RETURNS public.daily_schedules
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_row public.daily_schedules;
BEGIN
  IF increment <= 0 THEN
    RAISE EXCEPTION 'Increment must be greater than zero';
  END IF;

  UPDATE public.daily_schedules
  SET current_booked = current_booked + increment
  WHERE id = schedule_id
    AND current_booked + increment <= capacity
    AND status = 'active'
  RETURNING * INTO updated_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unable to increment capacity: schedule not found, capacity exceeded, or schedule not active';
  END IF;

  RETURN updated_row;
END;
$$;

COMMENT ON FUNCTION public.increment_schedule_capacity IS 'Increments booking count for a daily schedule with capacity validation';

-- Create function to decrement capacity (for cancellations)
CREATE OR REPLACE FUNCTION public.decrement_schedule_capacity(
  schedule_id UUID,
  decrement INTEGER
)
RETURNS public.daily_schedules
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_row public.daily_schedules;
BEGIN
  IF decrement <= 0 THEN
    RAISE EXCEPTION 'Decrement must be greater than zero';
  END IF;

  UPDATE public.daily_schedules
  SET current_booked = GREATEST(0, current_booked - decrement)
  WHERE id = schedule_id
  RETURNING * INTO updated_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule not found: %', schedule_id;
  END IF;

  RETURN updated_row;
END;
$$;

COMMENT ON FUNCTION public.decrement_schedule_capacity IS 'Decrements booking count for a daily schedule (used for cancellations)';

-- Update sync_daily_schedule_status function to work with new structure
CREATE OR REPLACE FUNCTION public.sync_schedule_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Skip status update for cancelled or expired schedules
  IF NEW.status IN ('cancelled', 'expired') THEN
    RETURN NEW;
  END IF;

  -- Update status based on current bookings vs capacity
  IF NEW.current_booked >= NEW.capacity THEN
    NEW.status := 'full';
  ELSE
    NEW.status := 'active';
  END IF;

  RETURN NEW;
END;
$$;

-- Update trigger for daily_schedules
DROP TRIGGER IF EXISTS daily_schedules_sync_status ON public.daily_schedules;

CREATE TRIGGER daily_schedules_sync_status
BEFORE INSERT OR UPDATE OF current_booked ON public.daily_schedules
FOR EACH ROW
EXECUTE FUNCTION public.sync_schedule_status();

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION public.validate_advance_booking TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_schedules TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_schedule_capacity TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_schedule_capacity TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_daily_schedules_from_template TO anon, authenticated;

-- Update RLS policies for booking_details view access
GRANT SELECT ON public.booking_details TO anon, authenticated;

-- Add realtime for schedule_times table
ALTER TABLE public.schedule_times REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'schedule_times'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_times;
  END IF;
END;
$$;