-- Simplify Baggage Fields Migration
-- Changes excess_baggage_count to has_excess_baggage boolean for simpler terms and conditions approach

-- Add new boolean column for excess baggage
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS has_excess_baggage BOOLEAN DEFAULT FALSE;

-- Migrate existing data: if excess_baggage_count > 0, set has_excess_baggage = true
UPDATE public.bookings 
SET has_excess_baggage = (excess_baggage_count > 0)
WHERE excess_baggage_count IS NOT NULL;

-- Update the booking_details view to use the new boolean field
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
  b.has_excess_baggage,
  b.excess_baggage_count, -- Keep for backward compatibility
  b.surfboard_cost,
  b.baggage_cost,
  b.total_cost,
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

-- Update the calculate_booking_costs function to work with boolean
CREATE OR REPLACE FUNCTION public.calculate_booking_costs(
  p_surfboard_count INTEGER DEFAULT 0,
  p_has_excess_baggage BOOLEAN DEFAULT FALSE,
  p_terminal TEXT DEFAULT NULL
)
RETURNS TABLE(
  surfboard_cost DECIMAL(10,2),
  baggage_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config_row public.pricing_config;
  calculated_surfboard_cost DECIMAL(10,2) := 0;
  calculated_baggage_cost DECIMAL(10,2) := 0;
  calculated_total_cost DECIMAL(10,2) := 0;
BEGIN
  -- Get active pricing configuration
  SELECT * INTO config_row FROM public.get_active_pricing_config();
  
  -- Calculate surfboard cost
  IF p_surfboard_count > 0 THEN
    calculated_surfboard_cost := p_surfboard_count * config_row.surfboard_cost_per_board;
  END IF;
  
  -- Calculate baggage cost (flat rate if has excess baggage)
  IF p_has_excess_baggage THEN
    IF p_terminal = 'Terminal 3' OR p_terminal = 'terminal3' OR p_terminal = 'T3' OR p_terminal = '3' THEN
      calculated_baggage_cost := config_row.baggage_terminal3_curbside_cost;
    ELSE
      calculated_baggage_cost := config_row.baggage_other_terminals_cost;
    END IF;
  END IF;
  
  -- Calculate total cost
  calculated_total_cost := calculated_surfboard_cost + calculated_baggage_cost;
  
  RETURN QUERY SELECT 
    calculated_surfboard_cost,
    calculated_baggage_cost,
    calculated_total_cost;
END;
$$;

-- Update driver notifications function to use boolean field
CREATE OR REPLACE FUNCTION create_driver_notifications_for_booking(
  p_booking_id UUID
)
RETURNS void AS $$
DECLARE
  v_booking RECORD;
BEGIN
  -- Get booking details
  SELECT 
    b.id,
    b.has_surfboard,
    b.surfboard_count,
    b.has_excess_baggage,
    b.room_number,
    b.flight_number,
    ds.service_type
  INTO v_booking
  FROM bookings b
  LEFT JOIN daily_schedules ds ON ds.id = b.daily_schedule_id
  WHERE b.id = p_booking_id;

  -- Create surfboard notification if applicable
  IF v_booking.has_surfboard AND v_booking.surfboard_count > 0 THEN
    INSERT INTO driver_notifications (booking_id, notification_type, message)
    VALUES (
      p_booking_id,
      'surfboard',
      format('⚠️ SURFBOARD: %s papan surfboard memerlukan penanganan khusus', v_booking.surfboard_count)
    );
  END IF;

  -- Create excess baggage notification if applicable
  IF v_booking.has_excess_baggage THEN
    INSERT INTO driver_notifications (booking_id, notification_type, message)
    VALUES (
      p_booking_id,
      'excess_baggage',
      '⚠️ BAGASI BERLEBIH: Penumpang memiliki bagasi melebihi batas gratis'
    );
  END IF;

  -- Create room number notification for drop-off if applicable
  IF v_booking.service_type = 'drop_off' AND v_booking.room_number IS NOT NULL THEN
    INSERT INTO driver_notifications (booking_id, notification_type, message)
    VALUES (
      p_booking_id,
      'room_number',
      format('📍 ROOM: Pickup dari kamar %s', v_booking.room_number)
    );
  END IF;

  -- Create flight number notification for pick-up if applicable
  IF v_booking.service_type = 'pick_up' AND v_booking.flight_number IS NOT NULL THEN
    INSERT INTO driver_notifications (booking_id, notification_type, message)
    VALUES (
      p_booking_id,
      'flight_number',
      format('✈️ FLIGHT: Penumpang dari penerbangan %s', v_booking.flight_number)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for the new boolean field
CREATE INDEX IF NOT EXISTS bookings_has_excess_baggage_idx ON public.bookings (has_excess_baggage) WHERE has_excess_baggage = true;

COMMENT ON COLUMN public.bookings.has_excess_baggage IS 'Boolean flag indicating if passenger has excess baggage beyond free allowance (simplified from count-based approach)';
COMMENT ON FUNCTION public.calculate_booking_costs(INTEGER, BOOLEAN, TEXT) IS 'Updated function to calculate costs using boolean excess baggage flag instead of count';