-- Schedule Management System Migration
-- This migration creates the schema for flexible schedule management with service types
-- Supports drop-off (hotel-to-airport) and pick-up (airport-to-hotel) services

-- Create service_type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type') THEN
    CREATE TYPE public.service_type AS ENUM ('drop_off', 'pick_up');
  END IF;
END;
$$;

-- Schedule Templates Table
-- Stores reusable schedule templates for different service types and hotels
CREATE TABLE IF NOT EXISTS public.schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  service_type public.service_type NOT NULL,
  hotel VARCHAR(50) NOT NULL CHECK (hotel IN ('ibis_style', 'ibis_budget')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, service_type, hotel)
);

CREATE INDEX schedule_templates_hotel_service_idx ON public.schedule_templates (hotel, service_type, is_active);

CREATE TRIGGER schedule_templates_set_updated_at
BEFORE UPDATE ON public.schedule_templates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.schedule_templates IS 'Reusable schedule templates for different service types and hotels';

-- Schedule Times Table
-- Individual departure times within templates
CREATE TABLE IF NOT EXISTS public.schedule_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.schedule_templates(id) ON DELETE CASCADE,
  departure_time TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 15 CHECK (capacity > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, departure_time)
);

CREATE INDEX schedule_times_template_id_idx ON public.schedule_times (template_id);
CREATE INDEX schedule_times_template_active_idx ON public.schedule_times (template_id, is_active);

COMMENT ON TABLE public.schedule_times IS 'Departure times within schedule templates';

-- Terminal Meeting Points Table
-- Airport terminal pickup locations with timing information
CREATE TABLE IF NOT EXISTS public.terminal_meeting_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_code VARCHAR(10) NOT NULL UNIQUE,
  location_description TEXT NOT NULL,
  arrival_time_offset_min INTEGER NOT NULL CHECK (arrival_time_offset_min > 0),
  arrival_time_offset_max INTEGER NOT NULL CHECK (arrival_time_offset_max >= arrival_time_offset_min),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX terminal_meeting_points_code_idx ON public.terminal_meeting_points (terminal_code);

CREATE TRIGGER terminal_meeting_points_set_updated_at
BEFORE UPDATE ON public.terminal_meeting_points
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.terminal_meeting_points IS 'Airport terminal pickup locations for pick-up services';

-- Update Bookings Table
-- Add service type and terminal information
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS service_type public.service_type,
ADD COLUMN IF NOT EXISTS terminal_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS meeting_point_id UUID REFERENCES public.terminal_meeting_points(id);

CREATE INDEX IF NOT EXISTS bookings_service_type_idx ON public.bookings (service_type);
CREATE INDEX IF NOT EXISTS bookings_terminal_code_idx ON public.bookings (terminal_code);
CREATE INDEX IF NOT EXISTS bookings_meeting_point_idx ON public.bookings (meeting_point_id);

COMMENT ON COLUMN public.bookings.service_type IS 'Type of service: drop_off (hotel to airport) or pick_up (airport to hotel)';
COMMENT ON COLUMN public.bookings.terminal_code IS 'Airport terminal code for pick-up services';
COMMENT ON COLUMN public.bookings.meeting_point_id IS 'Reference to terminal meeting point for pick-up services';

-- Row Level Security for new tables
ALTER TABLE public.schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminal_meeting_points ENABLE ROW LEVEL SECURITY;

-- Public read policies for active records
DROP POLICY IF EXISTS "Public read active schedule templates" ON public.schedule_templates;
CREATE POLICY "Public read active schedule templates"
  ON public.schedule_templates
  FOR SELECT
  USING (is_active);

DROP POLICY IF EXISTS "Public read active schedule times" ON public.schedule_times;
CREATE POLICY "Public read active schedule times"
  ON public.schedule_times
  FOR SELECT
  USING (is_active);

DROP POLICY IF EXISTS "Public read active terminal meeting points" ON public.terminal_meeting_points;
CREATE POLICY "Public read active terminal meeting points"
  ON public.terminal_meeting_points
  FOR SELECT
  USING (is_active);

-- Grant permissions
GRANT SELECT ON public.schedule_templates TO anon, authenticated;
GRANT SELECT ON public.schedule_times TO anon, authenticated;
GRANT SELECT ON public.terminal_meeting_points TO anon, authenticated;

-- Realtime configuration for schedule_templates
ALTER TABLE public.schedule_templates REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'schedule_templates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_templates;
  END IF;
END;
$$;
