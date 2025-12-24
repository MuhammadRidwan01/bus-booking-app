-- Update advance booking validation to 20 minutes instead of 24 hours
-- This migration updates the validate_advance_booking function to use 20 minutes

-- Update the advance booking validation function to use 20 minutes
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
  min_advance_minutes INTEGER := 20; -- Minimum 20 minutes advance booking
BEGIN
  -- Combine date and time into a timestamptz in the specified timezone
  departure_datetime := (departure_date || ' ' || departure_time)::TIMESTAMP AT TIME ZONE timezone_name;
  
  -- Get current time in the specified timezone
  current_datetime := NOW() AT TIME ZONE timezone_name;
  
  -- Check if departure is at least min_advance_minutes from now
  RETURN departure_datetime >= (current_datetime + (min_advance_minutes || ' minutes')::INTERVAL);
END;
$$;

COMMENT ON FUNCTION public.validate_advance_booking IS 'Validates that a booking is made with minimum advance notice (20 minutes)';