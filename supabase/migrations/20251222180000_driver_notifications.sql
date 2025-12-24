-- Create driver_notifications table for tracking notification delivery and acknowledgment
-- This supports the enhanced booking fields feature for driver notification system

CREATE TABLE IF NOT EXISTS public.driver_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('surfboard', 'excess_baggage', 'room_number', 'flight_number')),
  message TEXT NOT NULL,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS driver_notifications_booking_id_idx ON public.driver_notifications (booking_id);
CREATE INDEX IF NOT EXISTS driver_notifications_is_acknowledged_idx ON public.driver_notifications (is_acknowledged);
CREATE INDEX IF NOT EXISTS driver_notifications_created_at_idx ON public.driver_notifications (created_at DESC);

-- Add RLS policies for driver notifications
ALTER TABLE public.driver_notifications ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all notifications
CREATE POLICY "Service role can manage driver notifications"
  ON public.driver_notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users (drivers) to view and acknowledge notifications
CREATE POLICY "Authenticated users can view driver notifications"
  ON public.driver_notifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can acknowledge driver notifications"
  ON public.driver_notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_driver_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER driver_notifications_updated_at
  BEFORE UPDATE ON public.driver_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_notifications_updated_at();

-- Add function to create driver notifications from booking
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
    b.excess_baggage_count,
    b.room_number,
    b.flight_number,
    bd.service_type
  INTO v_booking
  FROM bookings b
  LEFT JOIN booking_details bd ON bd.id = b.id
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
  IF v_booking.excess_baggage_count > 0 THEN
    INSERT INTO driver_notifications (booking_id, notification_type, message)
    VALUES (
      p_booking_id,
      'excess_baggage',
      format('⚠️ BAGASI BERLEBIH: %s item bagasi tambahan', v_booking.excess_baggage_count)
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

-- Add function to acknowledge driver notification
CREATE OR REPLACE FUNCTION acknowledge_driver_notification(
  p_notification_id UUID,
  p_acknowledged_by TEXT DEFAULT 'driver'
)
RETURNS void AS $$
BEGIN
  UPDATE driver_notifications
  SET 
    is_acknowledged = TRUE,
    acknowledged_at = NOW(),
    acknowledged_by = p_acknowledged_by
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to get unacknowledged notifications for a date range
CREATE OR REPLACE FUNCTION get_unacknowledged_driver_notifications(
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  notification_id UUID,
  booking_id UUID,
  booking_code TEXT,
  customer_name TEXT,
  notification_type TEXT,
  message TEXT,
  schedule_date DATE,
  departure_time TIME,
  service_type TEXT,
  room_number TEXT,
  flight_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dn.id AS notification_id,
    dn.booking_id,
    bd.booking_code,
    bd.customer_name,
    dn.notification_type,
    dn.message,
    bd.schedule_date,
    bd.departure_time,
    bd.service_type,
    bd.room_number,
    bd.flight_number,
    dn.created_at
  FROM driver_notifications dn
  JOIN booking_details bd ON bd.id = dn.booking_id
  WHERE 
    dn.is_acknowledged = FALSE
    AND bd.schedule_date >= p_start_date
    AND bd.schedule_date <= p_end_date
    AND bd.status = 'confirmed'
  ORDER BY bd.schedule_date, bd.departure_time, dn.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.driver_notifications IS 'Tracks driver notifications for special handling requirements and acknowledgment status';
COMMENT ON FUNCTION create_driver_notifications_for_booking IS 'Creates driver notifications for a booking based on its special requirements';
COMMENT ON FUNCTION acknowledge_driver_notification IS 'Marks a driver notification as acknowledged';
COMMENT ON FUNCTION get_unacknowledged_driver_notifications IS 'Retrieves all unacknowledged driver notifications for a date range';
