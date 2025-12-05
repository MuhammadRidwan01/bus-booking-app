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
  room_number TEXT,
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

INSERT INTO admin_users (email, password_hash, salt, role, is_active)
VALUES (
  'admin@shuttle.test',
  '0f1b5c0be769a9497e2116d618aff5ee965e122b1b7c9dbf679857fe7ab4bdf6e84cd8b8a7cefe51a8decb089ae5aa950c2fcfba92353a560cc3b310f0a604f0',
  '1e6d26a40da84e12c7edadf557b90fd3',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;


DROP VIEW IF EXISTS booking_details;
CREATE OR REPLACE VIEW booking_details AS
SELECT 
  b.id,
  b.booking_code,
  b.customer_name,
  b.phone,
  b.passenger_count,
  b.status,
  b.whatsapp_sent,
  b.created_at AT TIME ZONE 'Asia/Jakarta' as created_at_jakarta,
  b.created_at,
  h.name as hotel_name,
  h.slug as hotel_slug,
  bs.departure_time,
  bs.destination,
  ds.schedule_date,
  ds.current_booked,
  bs.max_capacity,
  ds.status as schedule_status,
  (bs.max_capacity - ds.current_booked) as available_seats,
  b.room_number as room_number
FROM bookings b
JOIN hotels h ON b.hotel_id = h.id
JOIN daily_schedules ds ON b.daily_schedule_id = ds.id
JOIN bus_schedules bs ON ds.bus_schedule_id = bs.id;

-- View available schedules
CREATE OR REPLACE VIEW available_schedules AS
SELECT 
  ds.id as daily_schedule_id,
  h.id as hotel_id,
  h.name as hotel_name,
  h.slug as hotel_slug,
  bs.departure_time,
  bs.destination,
  ds.schedule_date,
  ds.current_booked,
  bs.max_capacity,
  (bs.max_capacity - ds.current_booked) as available_seats,
  ds.status
FROM daily_schedules ds
JOIN bus_schedules bs ON ds.bus_schedule_id = bs.id
JOIN hotels h ON bs.hotel_id = h.id
WHERE ds.status = 'active'
AND h.is_active = true
AND bs.is_active = true
ORDER BY ds.schedule_date, bs.departure_time;

-- Insert initial hotels
INSERT INTO hotels (name, slug) VALUES 
('Ibis Style Jakarta', 'ibis-style'),
('Ibis Budget Jakarta', 'ibis-budget')
ON CONFLICT (slug) DO NOTHING;

-- Insert bus schedules
INSERT INTO bus_schedules (hotel_id, departure_time, destination, max_capacity) 
SELECT h.id, departure_time, destination, 15
FROM hotels h
CROSS JOIN (
  VALUES 
    ('07:00'::TIME, 'Bandara Soekarno-Hatta'),
    ('09:00'::TIME, 'Mall Taman Anggrek'),
    ('11:00'::TIME, 'Grand Indonesia'),
    ('14:00'::TIME, 'Bandara Soekarno-Hatta'),
    ('16:00'::TIME, 'Mall Kelapa Gading'),
    ('18:00'::TIME, 'Ancol Beach City')
) AS schedules(departure_time, destination)
ON CONFLICT DO NOTHING;

-- Generate initial daily schedules
SELECT daily_maintenance();
