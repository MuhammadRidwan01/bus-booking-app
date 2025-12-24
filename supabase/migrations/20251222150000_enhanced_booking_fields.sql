-- Enhanced Booking Fields Migration
-- Adds service-specific fields, surfboard handling, baggage management, and pricing configuration

-- Add new columns to bookings table (room_number already exists from previous migration)
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS room_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS flight_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS has_surfboard BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS surfboard_count INTEGER DEFAULT 0 CHECK (surfboard_count >= 0),
ADD COLUMN IF NOT EXISTS excess_baggage_count INTEGER DEFAULT 0 CHECK (excess_baggage_count >= 0),
ADD COLUMN IF NOT EXISTS surfboard_cost DECIMAL(10,2) DEFAULT 0 CHECK (surfboard_cost >= 0),
ADD COLUMN IF NOT EXISTS baggage_cost DECIMAL(10,2) DEFAULT 0 CHECK (baggage_cost >= 0),
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0 CHECK (total_cost >= 0);

-- Create pricing configuration table
CREATE TABLE IF NOT EXISTS public.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surfboard_cost_per_board DECIMAL(10,2) NOT NULL DEFAULT 75000 CHECK (surfboard_cost_per_board >= 0),
  baggage_free_items_per_passenger INTEGER NOT NULL DEFAULT 2 CHECK (baggage_free_items_per_passenger >= 0),
  baggage_terminal3_curbside_cost DECIMAL(10,2) NOT NULL DEFAULT 150000 CHECK (baggage_terminal3_curbside_cost >= 0),
  baggage_other_terminals_cost DECIMAL(10,2) NOT NULL DEFAULT 75000 CHECK (baggage_other_terminals_cost >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
  effective_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by VARCHAR(100) NOT NULL DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS bookings_room_number_idx ON public.bookings (room_number) WHERE room_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS bookings_flight_number_idx ON public.bookings (flight_number) WHERE flight_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS pricing_config_active_idx ON public.pricing_config (is_active, effective_date DESC);

-- Insert default pricing configuration
INSERT INTO public.pricing_config (
  surfboard_cost_per_board,
  baggage_free_items_per_passenger,
  baggage_terminal3_curbside_cost,
  baggage_other_terminals_cost,
  currency,
  created_by
) VALUES (
  75000,  -- IDR 75,000 per surfboard
  2,      -- 2 free items per passenger
  150000, -- IDR 150,000 for Terminal 3 curbside
  75000,  -- IDR 75,000 for other terminals
  'IDR',
  'migration'
) ON CONFLICT DO NOTHING;

-- Add trigger to maintain updated_at for pricing_config
CREATE TRIGGER pricing_config_set_updated_at
BEFORE UPDATE ON public.pricing_config
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add RLS policies for pricing_config
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active pricing configuration
DROP POLICY IF EXISTS "Public read active pricing config" ON public.pricing_config;
CREATE POLICY "Public read active pricing config"
  ON public.pricing_config
  FOR SELECT
  USING (is_active = true);

-- Create function to get current active pricing configuration
CREATE OR REPLACE FUNCTION public.get_active_pricing_config()
RETURNS public.pricing_config
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config_row public.pricing_config;
BEGIN
  SELECT * INTO config_row
  FROM public.pricing_config
  WHERE is_active = true
  ORDER BY effective_date DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active pricing configuration found';
  END IF;
  
  RETURN config_row;
END;
$$;

-- Create function to calculate booking costs
CREATE OR REPLACE FUNCTION public.calculate_booking_costs(
  p_surfboard_count INTEGER DEFAULT 0,
  p_excess_baggage_count INTEGER DEFAULT 0,
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
  
  -- Calculate baggage cost
  IF p_excess_baggage_count > 0 THEN
    IF p_terminal = 'Terminal 3' OR p_terminal = 'terminal3' THEN
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

-- Update booking_details view to include new fields
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
  b.excess_baggage_count,
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

COMMENT ON VIEW public.booking_details IS 'Aggregated booking information including enhanced fields for service-specific data, surfboard handling, and baggage management.';

-- Grant permissions
GRANT SELECT ON public.pricing_config TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_pricing_config() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_booking_costs(INTEGER, INTEGER, TEXT) TO anon, authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.pricing_config IS 'Configuration table for additional service pricing including surfboard and baggage fees.';
COMMENT ON COLUMN public.pricing_config.surfboard_cost_per_board IS 'Cost per surfboard in the specified currency (default: IDR 75,000).';
COMMENT ON COLUMN public.pricing_config.baggage_free_items_per_passenger IS 'Number of free baggage items per passenger (default: 2).';
COMMENT ON COLUMN public.pricing_config.baggage_terminal3_curbside_cost IS 'Cost for excess baggage at Terminal 3 curbside (default: IDR 150,000).';
COMMENT ON COLUMN public.pricing_config.baggage_other_terminals_cost IS 'Cost for excess baggage at other terminals (default: IDR 75,000).';