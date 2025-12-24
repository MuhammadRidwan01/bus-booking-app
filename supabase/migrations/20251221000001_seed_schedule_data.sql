-- Seed Initial Schedule Data
-- This migration populates the schedule management system with initial data
-- Includes Ibis Styles schedules and terminal meeting points

-- Insert Terminal Meeting Points
INSERT INTO public.terminal_meeting_points (terminal_code, location_description, arrival_time_offset_min, arrival_time_offset_max) VALUES
('1A', '2nd floor - arrival pick up point 1A', 15, 20),
('1B', '2nd floor - arrival pick up point 1B', 15, 20),
('1C', '2nd floor - arrival pick up point 1C', 15, 20),
('2E', '2nd floor - arrival pick up point 2E', 25, 30),
('2F', '2nd floor - arrival pick up point 2F', 25, 30),
('3', 'East Lobby - in front of domestic parking building', 30, 45)
ON CONFLICT (terminal_code) DO NOTHING;

-- Update daily_schedules table structure to support service_type
ALTER TABLE public.daily_schedules
ADD COLUMN IF NOT EXISTS service_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS hotel VARCHAR(50),
ADD COLUMN IF NOT EXISTS departure_time TIME,
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Make bus_schedule_id nullable for new schedule management approach
ALTER TABLE public.daily_schedules
ALTER COLUMN bus_schedule_id DROP NOT NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS daily_schedules_service_type_idx ON public.daily_schedules (service_type);
CREATE INDEX IF NOT EXISTS daily_schedules_hotel_idx ON public.daily_schedules (hotel);
CREATE INDEX IF NOT EXISTS daily_schedules_hotel_service_date_idx ON public.daily_schedules (hotel, service_type, schedule_date);

-- Update unique constraint to include service_type and hotel
ALTER TABLE public.daily_schedules
DROP CONSTRAINT IF EXISTS daily_schedules_bus_schedule_id_schedule_date_key;

-- Add new unique constraint
ALTER TABLE public.daily_schedules
ADD CONSTRAINT daily_schedules_unique_schedule
UNIQUE (schedule_date, service_type, hotel, departure_time);

-- Insert Ibis Styles Drop-off Schedule Template
INSERT INTO public.schedule_templates (name, service_type, hotel, is_active) VALUES
('Ibis Styles Drop-off Schedule', 'drop_off', 'ibis_style', true)
ON CONFLICT (name, service_type, hotel) DO NOTHING;

-- Insert Ibis Styles Pick-up Schedule Template
INSERT INTO public.schedule_templates (name, service_type, hotel, is_active) VALUES
('Ibis Styles Pick-up Schedule', 'pick_up', 'ibis_style', true)
ON CONFLICT (name, service_type, hotel) DO NOTHING;

-- Get template IDs for inserting schedule times
DO $$
DECLARE
  drop_off_template_id UUID;
  pick_up_template_id UUID;
BEGIN
  -- Get drop-off template ID
  SELECT id INTO drop_off_template_id
  FROM public.schedule_templates
  WHERE name = 'Ibis Styles Drop-off Schedule' AND service_type = 'drop_off' AND hotel = 'ibis_style';

  -- Get pick-up template ID
  SELECT id INTO pick_up_template_id
  FROM public.schedule_templates
  WHERE name = 'Ibis Styles Pick-up Schedule' AND service_type = 'pick_up' AND hotel = 'ibis_style';

  -- Insert drop-off schedule times (hotel to airport)
  IF drop_off_template_id IS NOT NULL THEN
    INSERT INTO public.schedule_times (template_id, departure_time, capacity) VALUES
    (drop_off_template_id, '03:00', 15),
    (drop_off_template_id, '04:30', 15),
    (drop_off_template_id, '06:00', 15),
    (drop_off_template_id, '07:30', 15),
    (drop_off_template_id, '09:00', 15),
    (drop_off_template_id, '10:30', 15),
    (drop_off_template_id, '12:00', 15),
    (drop_off_template_id, '14:00', 15),
    (drop_off_template_id, '16:00', 15),
    (drop_off_template_id, '18:00', 15),
    (drop_off_template_id, '20:00', 15),
    (drop_off_template_id, '22:00', 15),
    (drop_off_template_id, '00:00', 15)
    ON CONFLICT (template_id, departure_time) DO NOTHING;
  END IF;

  -- Insert pick-up schedule times (airport to hotel)
  IF pick_up_template_id IS NOT NULL THEN
    INSERT INTO public.schedule_times (template_id, departure_time, capacity) VALUES
    (pick_up_template_id, '13:00', 15),
    (pick_up_template_id, '14:00', 15),
    (pick_up_template_id, '15:00', 15),
    (pick_up_template_id, '16:00', 15),
    (pick_up_template_id, '17:00', 15),
    (pick_up_template_id, '18:00', 15),
    (pick_up_template_id, '19:00', 15),
    (pick_up_template_id, '20:00', 15),
    (pick_up_template_id, '21:00', 15),
    (pick_up_template_id, '22:00', 15),
    (pick_up_template_id, '23:00', 15),
    (pick_up_template_id, '00:00', 15)
    ON CONFLICT (template_id, departure_time) DO NOTHING;
  END IF;
END;
$$;

-- Function to generate daily schedules from templates
CREATE OR REPLACE FUNCTION public.generate_daily_schedules_from_template(
  template_id_param UUID,
  start_date DATE,
  end_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  template_record RECORD;
  time_record RECORD;
  generated_count INTEGER := 0;
  loop_date DATE;
BEGIN
  -- Get template information
  SELECT * INTO template_record
  FROM public.schedule_templates
  WHERE id = template_id_param AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or inactive: %', template_id_param;
  END IF;

  -- Generate schedules for each date in range
  loop_date := start_date;
  WHILE loop_date <= end_date LOOP
    -- Insert daily schedules for each time in the template
    FOR time_record IN
      SELECT departure_time, capacity
      FROM public.schedule_times
      WHERE template_id = template_id_param AND is_active = true
    LOOP
      INSERT INTO public.daily_schedules (
        schedule_date,
        service_type,
        hotel,
        departure_time,
        capacity,
        current_booked,
        is_active
      ) VALUES (
        loop_date,
        template_record.service_type::VARCHAR(20),
        template_record.hotel,
        time_record.departure_time,
        time_record.capacity,
        0,
        true
      )
      ON CONFLICT (schedule_date, service_type, hotel, departure_time) DO NOTHING;

      generated_count := generated_count + 1;
    END LOOP;

    loop_date := loop_date + INTERVAL '1 day';
  END LOOP;

  RETURN generated_count;
END;
$$;

-- Generate daily schedules for next 30 days from templates
DO $$
DECLARE
  drop_off_template_id UUID;
  pick_up_template_id UUID;
  start_date DATE;
  end_date DATE;
  generated_count INTEGER;
BEGIN
  -- Set date range (next 30 days)
  start_date := CURRENT_DATE;
  end_date := CURRENT_DATE + INTERVAL '30 days';

  -- Get template IDs
  SELECT id INTO drop_off_template_id
  FROM public.schedule_templates
  WHERE name = 'Ibis Styles Drop-off Schedule' AND service_type = 'drop_off' AND hotel = 'ibis_style';

  SELECT id INTO pick_up_template_id
  FROM public.schedule_templates
  WHERE name = 'Ibis Styles Pick-up Schedule' AND service_type = 'pick_up' AND hotel = 'ibis_style';

  -- Generate drop-off schedules
  IF drop_off_template_id IS NOT NULL THEN
    SELECT public.generate_daily_schedules_from_template(
      drop_off_template_id,
      start_date,
      end_date
    ) INTO generated_count;
    RAISE NOTICE 'Generated % drop-off daily schedules', generated_count;
  END IF;

  -- Generate pick-up schedules
  IF pick_up_template_id IS NOT NULL THEN
    SELECT public.generate_daily_schedules_from_template(
      pick_up_template_id,
      start_date,
      end_date
    ) INTO generated_count;
    RAISE NOTICE 'Generated % pick-up daily schedules', generated_count;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.generate_daily_schedules_from_template IS 'Generates daily schedule instances from a template for a date range';