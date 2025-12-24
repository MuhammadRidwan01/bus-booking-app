-- Add driver_notes column for storing driver notifications about additional services
-- This supports the enhanced booking fields feature for surfboard and baggage notifications

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS driver_notes TEXT;

-- Add index for driver notes queries
CREATE INDEX IF NOT EXISTS bookings_driver_notes_idx ON public.bookings (driver_notes) WHERE driver_notes IS NOT NULL;

-- Update booking_details view to include driver_notes
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
  b.whatsapp_attempts,
  b.whatsapp_last_error,
  b.room_number,
  b.flight_number,
  b.terminal,
  b.is_surfboard,
  b.has_surfboard,
  b.surfboard_count,
  b.excess_baggage_count,
  b.surfboard_cost,
  b.baggage_cost,
  b.total_cost,
  b.driver_notes,
  b.created_at,
  b.updated_at,
  h.name as hotel_name,
  h.slug as hotel_slug,
  bs.departure_time,
  bs.destination,
  ds.schedule_date
FROM public.bookings b
JOIN public.hotels h ON h.id = b.hotel_id
JOIN public.daily_schedules ds ON ds.id = b.daily_schedule_id
JOIN public.bus_schedules bs ON bs.id = ds.bus_schedule_id;

COMMENT ON COLUMN public.bookings.driver_notes IS 'Special instructions for drivers regarding surfboard handling, excess baggage, or other additional services.';