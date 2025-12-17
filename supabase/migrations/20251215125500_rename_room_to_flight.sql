-- Rename column room_number to flight_number in bookings table
ALTER TABLE public.bookings 
RENAME COLUMN room_number TO flight_number;

-- Update comments
COMMENT ON COLUMN public.bookings.flight_number IS 'Flight number for the guest (e.g. GA123)';

-- Recreate booking_details view with new column name
-- First drop the view
DROP VIEW IF EXISTS public.booking_details;

-- Create the view again with flight_number
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
  b.flight_number, -- Renamed from room_number
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

COMMENT ON VIEW public.booking_details IS 'Aggregated booking information for ticket tracking, including flight number.';
