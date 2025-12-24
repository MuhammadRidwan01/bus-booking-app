-- Migration to update bus schedules and terminal meeting points based on new image requirements
-- Clears old schedules and regenerates them for the next 30 days linked to the new bus_schedules
-- Also updates terminal meeting points

-- 1. Clear existing data
DELETE FROM daily_schedules;
DELETE FROM bus_schedules;
DELETE FROM terminal_meeting_points;

-- 2. Insert Terminal Meeting Points associated with the image
INSERT INTO terminal_meeting_points (terminal_code, location_description, arrival_time_offset_min, arrival_time_offset_max) VALUES
('1A', '2nd line - Arrival pick up point area', 15, 20),
('1B', '2nd line - Arrival pick up point area', 15, 20),
('1C', '2nd line - Arrival pick up point area', 15, 20),
('2D', '2nd line - pick-up point 2D / under sky train', 25, 30),
('2E', '2nd line - pick-up point 2E / under sky train', 25, 30),
('2F', '2nd line - pick-up point 2F / under sky train', 25, 30),
('3', 'East Lobby - in front of domestic parking building', 30, 45);

-- 3. Insert Bus Schedules (Drop-off: Hotel -> Airport)
-- Destination: Soekarno-Hatta International Airport
INSERT INTO bus_schedules (hotel_id, departure_time, destination, max_capacity)
SELECT id, time, 'Soekarno-Hatta International Airport', 15
FROM hotels
CROSS JOIN (
  VALUES 
    ('03:00'::TIME), ('04:30'::TIME), ('06:00'::TIME), ('07:30'::TIME),
    ('09:00'::TIME), ('10:30'::TIME), ('12:00'::TIME), ('14:00'::TIME),
    ('16:00'::TIME), ('18:00'::TIME), ('20:00'::TIME), ('22:00'::TIME), ('00:00'::TIME)
) AS t(time);

-- 4. Insert Bus Schedules (Pick-up: Airport -> Hotel)
-- Destination: Ibis Styles Jakarta Airport
INSERT INTO bus_schedules (hotel_id, departure_time, destination, max_capacity)
SELECT id, time, 'Ibis Styles Jakarta Airport', 15
FROM hotels
CROSS JOIN (
  VALUES 
    ('13:00'::TIME), ('14:00'::TIME), ('15:00'::TIME), ('16:00'::TIME),
    ('17:00'::TIME), ('18:00'::TIME), ('19:00'::TIME), ('20:00'::TIME),
    ('21:00'::TIME), ('22:00'::TIME), ('23:00'::TIME), ('00:00'::TIME)
) AS t(time);

-- 5. Generate Daily Schedules for next 30 days
DO $$
DECLARE
  start_date DATE := CURRENT_DATE;
  end_date DATE := CURRENT_DATE + INTERVAL '30 days';
  curr_date DATE;
BEGIN
  curr_date := start_date;
  WHILE curr_date <= end_date LOOP
    INSERT INTO daily_schedules (bus_schedule_id, schedule_date, current_booked, status, service_type, hotel, departure_time, capacity)
    SELECT 
      bs.id,
      curr_date,
      0,
      'active',
      -- Infer service type
      CASE 
        WHEN bs.destination LIKE '%Airport%' AND bs.destination NOT LIKE '%Ibis%' THEN 'drop_off'
        ELSE 'pick_up' 
      END,
      -- Map hotel slug to format expected by frontend
      CASE 
        WHEN h.slug = 'ibis-styles' THEN 'ibis_style'
        WHEN h.slug = 'ibis-budget' THEN 'ibis_budget'
        ELSE REPLACE(h.slug, '-', '_')
      END,
      bs.departure_time,
      bs.max_capacity
    FROM bus_schedules bs
    JOIN hotels h ON bs.hotel_id = h.id
    ON CONFLICT (schedule_date, service_type, hotel, departure_time) DO NOTHING;

    curr_date := curr_date + INTERVAL '1 day';
  END LOOP;
END;
$$;
