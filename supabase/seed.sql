-- Enhanced Supabase Database Schema untuk Booking Bus Ibis Hotels
-- dengan timezone handling dan automated scheduling

-- Set timezone untuk database (gunakan di Supabase Dashboard > Settings > General)
ALTER DATABASE postgres SET timezone TO 'Asia/Jakarta';

-- Hotels table
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bus schedules template (per hotel)
CREATE TABLE bus_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id),
  departure_time TIME NOT NULL,
  destination VARCHAR(100) NOT NULL,
  max_capacity INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily schedules (generated daily)
CREATE TABLE daily_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_schedule_id UUID REFERENCES bus_schedules(id),
  schedule_date DATE NOT NULL,
  current_booked INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active', -- active, full, expired, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bus_schedule_id, schedule_date)
);

-- Tabel room_numbers untuk daftar kamar valid per hotel
CREATE TABLE room_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_number VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(hotel_id, room_number)
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code VARCHAR(20) UNIQUE NOT NULL,
  hotel_id UUID REFERENCES hotels(id),
  daily_schedule_id UUID REFERENCES daily_schedules(id),
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  passenger_count INTEGER CHECK (passenger_count BETWEEN 1 AND 5),
  status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, cancelled
  whatsapp_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  room_number_id UUID REFERENCES room_numbers(id)
);

-- Seed data room_numbers untuk masing-masing hotel
-- Ibis Style: 101, 102, 103, 201, 202, 203
INSERT INTO room_numbers (hotel_id, room_number) 
SELECT h.id, rn
FROM hotels h, unnest(ARRAY['101','102','103','201','202','203']) rn
WHERE h.slug = 'ibis-style';

-- Ibis Budget: A1, A2, B1, B2
INSERT INTO room_numbers (hotel_id, room_number) 
SELECT h.id, rn
FROM hotels h, unnest(ARRAY['A1','A2','B1','B2']) rn
WHERE h.slug = 'ibis-budget';

-- Function untuk generate jadwal harian otomatis (diperbaiki)
CREATE OR REPLACE FUNCTION generate_daily_schedules()
RETURNS void AS $function$
DECLARE
  jakarta_date DATE;
BEGIN
  -- Get current date in Jakarta timezone
  SELECT CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' INTO jakarta_date;
  
  -- Generate untuk hari ini (jika belum ada)
  INSERT INTO daily_schedules (bus_schedule_id, schedule_date, current_booked, status)
  SELECT 
    bs.id,
    jakarta_date as schedule_date,
    0 as current_booked,
    'active' as status
  FROM bus_schedules bs
  WHERE bs.is_active = true
  ON CONFLICT (bus_schedule_id, schedule_date) DO NOTHING;

  -- Generate untuk besok
  INSERT INTO daily_schedules (bus_schedule_id, schedule_date, current_booked, status)
  SELECT 
    bs.id,
    jakarta_date + interval '1 days' as schedule_date,
    0 as current_booked,
    'active' as status
  FROM bus_schedules bs
  WHERE bs.is_active = true
  ON CONFLICT (bus_schedule_id, schedule_date) DO NOTHING;

  -- Generate untuk lusa (untuk booking yang lebih jauh)
  INSERT INTO daily_schedules (bus_schedule_id, schedule_date, current_booked, status)
  SELECT 
    bs.id,
    jakarta_date + interval '2 days' as schedule_date,
    0 as current_booked,
    'active' as status
  FROM bus_schedules bs
  WHERE bs.is_active = true
  ON CONFLICT (bus_schedule_id, schedule_date) DO NOTHING;
END;
$function$ LANGUAGE plpgsql;

-- Function untuk cleanup jadwal expired dan update status
CREATE OR REPLACE FUNCTION cleanup_expired_schedules()
RETURNS void AS $function$
DECLARE
  jakarta_date DATE;
  jakarta_time TIME;
BEGIN
  -- Get current date and time in Jakarta timezone
  SELECT 
    CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta',
    CURRENT_TIME AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'
  INTO jakarta_date, jakarta_time;
  
  -- Mark expired schedules (past dates)
  UPDATE daily_schedules 
  SET status = 'expired', updated_at = NOW()
  WHERE schedule_date < jakarta_date 
  AND status NOT IN ('expired', 'cancelled');
  
  -- Mark expired schedules (today but past departure time)
  UPDATE daily_schedules ds
  SET status = 'expired', updated_at = NOW()
  FROM bus_schedules bs
  WHERE ds.bus_schedule_id = bs.id
  AND ds.schedule_date = jakarta_date
  AND bs.departure_time < jakarta_time
  AND ds.status NOT IN ('expired', 'cancelled');
  
  -- Optional: Delete very old expired schedules (older than 7 days)
  DELETE FROM daily_schedules 
  WHERE schedule_date < jakarta_date - interval '7 days'
  AND status = 'expired';
  
END;
$function$ LANGUAGE plpgsql;

-- Function untuk daily maintenance (kombinasi generate + cleanup)
CREATE OR REPLACE FUNCTION daily_maintenance()
RETURNS void AS $function$
BEGIN
  -- Cleanup expired schedules first
  PERFORM cleanup_expired_schedules();
  
  -- Generate new schedules
  PERFORM generate_daily_schedules();
  
  -- Log maintenance (optional)
  RAISE NOTICE 'Daily maintenance completed at %', NOW();
END;
$function$ LANGUAGE plpgsql;

-- Function increment capacity (tidak berubah)
CREATE OR REPLACE FUNCTION increment_capacity(schedule_id UUID, increment INTEGER)
RETURNS void AS $function$
BEGIN
  UPDATE daily_schedules 
  SET current_booked = current_booked + increment,
      status = CASE 
        WHEN current_booked + increment >= (
          SELECT max_capacity FROM bus_schedules bs 
          WHERE bs.id = daily_schedules.bus_schedule_id
        ) THEN 'full'
        ELSE 'active'
      END,
      updated_at = NOW()
  WHERE id = schedule_id;
END;
$function$ LANGUAGE plpgsql;

-- Function untuk create booking (sedikit diperbaiki)
CREATE OR REPLACE FUNCTION create_booking_with_capacity(
  p_booking_code VARCHAR(20),
  p_hotel_id UUID,
  p_daily_schedule_id UUID,
  p_customer_name VARCHAR(100),
  p_phone VARCHAR(20),
  p_passenger_count INTEGER
)
RETURNS TABLE(
  id UUID,
  booking_code VARCHAR(20),
  customer_name VARCHAR(100),
  phone VARCHAR(20),
  passenger_count INTEGER,
  hotel_name VARCHAR(100),
  departure_time TIME,
  destination VARCHAR(100),
  schedule_date DATE
) AS $function$
DECLARE
  booking_id UUID;
  current_capacity INTEGER;
  max_cap INTEGER;
  schedule_status VARCHAR(20);
BEGIN
  -- Check current capacity and status
  SELECT ds.current_booked, bs.max_capacity, ds.status
  INTO current_capacity, max_cap, schedule_status
  FROM daily_schedules ds
  JOIN bus_schedules bs ON ds.bus_schedule_id = bs.id
  WHERE ds.id = p_daily_schedule_id;
  
  -- Check if schedule is still active
  IF schedule_status != 'active' THEN
    RAISE EXCEPTION 'Jadwal tidak tersedia. Status: %', schedule_status;
  END IF;
  
  -- Check if capacity is available
  IF current_capacity + p_passenger_count > max_cap THEN
    RAISE EXCEPTION 'Kapasitas tidak mencukupi. Tersisa: %', (max_cap - current_capacity);
  END IF;
  
  -- Create booking
  INSERT INTO bookings (booking_code, hotel_id, daily_schedule_id, customer_name, phone, passenger_count)
  VALUES (p_booking_code, p_hotel_id, p_daily_schedule_id, p_customer_name, p_phone, p_passenger_count)
  RETURNING bookings.id INTO booking_id;
  
  -- Update capacity
  PERFORM increment_capacity(p_daily_schedule_id, p_passenger_count);
  
  -- Return booking details
  RETURN QUERY
  SELECT 
    b.id,
    b.booking_code,
    b.customer_name,
    b.phone,
    b.passenger_count,
    h.name as hotel_name,
    bs.departure_time,
    bs.destination,
    ds.schedule_date
  FROM bookings b
  JOIN hotels h ON b.hotel_id = h.id
  JOIN daily_schedules ds ON b.daily_schedule_id = ds.id
  JOIN bus_schedules bs ON ds.bus_schedule_id = bs.id
  WHERE b.id = booking_id;
END;
$function$ LANGUAGE plpgsql;

-- Enhanced view untuk booking details dengan timezone
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
  rn.room_number as room_number
FROM bookings b
JOIN hotels h ON b.hotel_id = h.id
JOIN daily_schedules ds ON b.daily_schedule_id = ds.id
JOIN bus_schedules bs ON ds.bus_schedule_id = bs.id
LEFT JOIN room_numbers rn ON b.room_number_id = rn.id;

-- View untuk available schedules (hanya yang masih aktif)
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

-- Insert initial data
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

INSERT INTO room_numbers (hotel_id, room_number) 
SELECT h.id, rn
FROM hotels h, unnest(ARRAY['101','102','103','201','202','203']) rn
WHERE h.slug = 'ibis-style';

-- Ibis Budget: A1, A2, B1, B2
INSERT INTO room_numbers (hotel_id, room_number) 
SELECT h.id, rn
FROM hotels h, unnest(ARRAY['A1','A2','B1','B2']) rn
WHERE h.slug = 'ibis-budget';

-- Generate initial daily schedules
SELECT daily_maintenance();