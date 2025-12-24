-- Enhanced Supabase Database Schema untuk Booking Bus Ibis Hotels
-- dengan timezone handling dan automated scheduling

-- Set timezone untuk database (gunakan di Supabase Dashboard > Settings > General)
ALTER DATABASE postgres SET timezone TO 'Asia/Jakarta';

CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bus schedules template (per hotel)
CREATE TABLE IF NOT EXISTS bus_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id),
  departure_time TIME NOT NULL,
  destination VARCHAR(100) NOT NULL,
  max_capacity INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily schedules (generated daily)
CREATE TABLE IF NOT EXISTS daily_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_schedule_id UUID REFERENCES bus_schedules(id),
  schedule_date DATE NOT NULL,
  current_booked INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active', -- active, full, expired, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bus_schedule_id, schedule_date)
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code VARCHAR(20) UNIQUE NOT NULL,
  hotel_id UUID REFERENCES hotels(id),
  daily_schedule_id UUID REFERENCES daily_schedules(id),
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  passenger_count INTEGER CHECK (passenger_count BETWEEN 1 AND 5),
  status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, cancelled
  whatsapp_sent BOOLEAN DEFAULT false,
  flight_number TEXT,
  terminal TEXT NULL,
  is_surfboard BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Insert admin user (only if doesn't exist)
INSERT INTO admin_users (email, password_hash, salt, role, is_active)
SELECT 
  'admin@shuttle.test',
  '0f1b5c0be769a9497e2116d618aff5ee965e122b1b7c9dbf679857fe7ab4bdf6e84cd8b8a7cefe51a8decb089ae5aa950c2fcfba92353a560cc3b310f0a604f0',
  '1e6d26a40da84e12c7edadf557b90fd3',
  'admin',
  true
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@shuttle.test');

-- Note: Views will be created by migrations, not in seed file
-- This avoids conflicts with the new schedule management schema

-- Insert initial hotels (only if they don't exist)
INSERT INTO hotels (name, slug)
SELECT 'Ibis styles Jakarta', 'ibis-styles'
WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE slug = 'ibis-styles');

INSERT INTO hotels (name, slug)
SELECT 'Ibis Budget Jakarta', 'ibis-budget'
WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE slug = 'ibis-budget');

-- Insert bus schedules (only if they don't exist)
-- 3. Insert Bus Schedules (Drop-off: Hotel -> Airport)

-- IBIS STYLES DROP-OFF
INSERT INTO bus_schedules (hotel_id, departure_time, destination, max_capacity)
SELECT h.id, t.time, 'Soekarno-Hatta International Airport', 15
FROM hotels h
CROSS JOIN (
  VALUES 
    ('03:00'::TIME), ('04:30'::TIME), ('06:00'::TIME), ('07:30'::TIME),
    ('09:00'::TIME), ('10:30'::TIME), ('12:00'::TIME), ('14:00'::TIME),
    ('16:00'::TIME), ('18:00'::TIME), ('20:00'::TIME), ('22:00'::TIME), ('00:00'::TIME)
) AS t(time)
WHERE h.slug = 'ibis-styles';

-- IBIS BUDGET DROP-OFF (From new image)
INSERT INTO bus_schedules (hotel_id, departure_time, destination, max_capacity)
SELECT h.id, t.time, 'Soekarno-Hatta International Airport', 15
FROM hotels h
CROSS JOIN (
  VALUES 
    ('02:45'::TIME), ('04:15'::TIME), ('05:45'::TIME), ('07:15'::TIME),
    ('08:45'::TIME), ('10:15'::TIME), ('11:45'::TIME), ('13:50'::TIME),
    ('15:50'::TIME), ('17:50'::TIME), ('19:50'::TIME), ('21:50'::TIME), ('23:50'::TIME)
) AS t(time)
WHERE h.slug = 'ibis-budget';


-- 4. Insert Bus Schedules (Pick-up: Airport -> Hotel)

-- IBIS STYLES PICK-UP
INSERT INTO bus_schedules (hotel_id, departure_time, destination, max_capacity)
SELECT h.id, t.time, 'Ibis Styles Jakarta Airport', 15
FROM hotels h
CROSS JOIN (
  VALUES 
    ('13:00'::TIME), ('14:00'::TIME), ('15:00'::TIME), ('16:00'::TIME),
    ('17:00'::TIME), ('18:00'::TIME), ('19:00'::TIME), ('20:00'::TIME),
    ('21:00'::TIME), ('22:00'::TIME), ('23:00'::TIME), ('00:00'::TIME)
) AS t(time)
WHERE h.slug = 'ibis-styles';

-- IBIS BUDGET PICK-UP (From new image)
-- Note: Image shows 24:00 which is 00:00
INSERT INTO bus_schedules (hotel_id, departure_time, destination, max_capacity)
SELECT h.id, t.time, 'Ibis Budget Jakarta Airport', 15
FROM hotels h
CROSS JOIN (
  VALUES 
    ('13:00'::TIME), ('14:00'::TIME), ('15:00'::TIME), ('16:00'::TIME),
    ('17:00'::TIME), ('18:00'::TIME), ('19:00'::TIME), ('20:00'::TIME),
    ('21:00'::TIME), ('22:00'::TIME), ('23:00'::TIME), ('00:00'::TIME)
) AS t(time)
WHERE h.slug = 'ibis-budget';

-- TERMINAL MEETING POINTS
INSERT INTO terminal_meeting_points (terminal_code, location_description, arrival_time_offset_min, arrival_time_offset_max) VALUES
('1A', '2nd line - Arrival pick up point area', 15, 20),
('1B', '2nd line - Arrival pick up point area', 15, 20),
('1C', '2nd line - Arrival pick up point area', 15, 20),
('2D', '2nd line - pick-up point 2D / under sky train', 25, 30),
('2E', '2nd line - pick-up point 2E / under sky train', 25, 30),
('2F', '2nd line - pick-up point 2F / under sky train', 25, 30),
('3', 'East Lobby - in front of domestic parking building', 30, 45)
ON CONFLICT (terminal_code) DO NOTHING;

-- GENERATE DAILY SCHEDULES
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