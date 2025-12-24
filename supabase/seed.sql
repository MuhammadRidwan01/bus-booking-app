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
INSERT INTO bus_schedules (hotel_id, departure_time, destination, max_capacity)
SELECT h.id, t.departure_time, t.destination, 15
FROM hotels h
CROSS JOIN (
  VALUES 
    ('07:00'::TIME, 'Bandara Soekarno-Hatta'),
    ('09:00'::TIME, 'Mall Taman Anggrek'),
    ('11:00'::TIME, 'Grand Indonesia'),
    ('14:00'::TIME, 'Bandara Soekarno-Hatta'),
    ('16:00'::TIME, 'Mall Kelapa Gading'),
    ('18:00'::TIME, 'Ancol Beach City')
) AS t(departure_time, destination)
WHERE NOT EXISTS (
  SELECT 1 FROM bus_schedules bs 
  WHERE bs.hotel_id = h.id 
    AND bs.departure_time = t.departure_time 
    AND bs.destination = t.destination
);