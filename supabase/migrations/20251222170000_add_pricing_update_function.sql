-- Add function to update pricing configuration atomically
-- This ensures only one active configuration exists at a time

CREATE OR REPLACE FUNCTION public.update_pricing_configuration(
  p_surfboard_cost DECIMAL(10,2),
  p_terminal3_cost DECIMAL(10,2),
  p_other_terminals_cost DECIMAL(10,2),
  p_created_by VARCHAR(100) DEFAULT 'admin'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate inputs
  IF p_surfboard_cost < 0 OR p_terminal3_cost < 0 OR p_other_terminals_cost < 0 THEN
    RAISE EXCEPTION 'Pricing values cannot be negative';
  END IF;

  -- Deactivate all existing configurations
  UPDATE public.pricing_config 
  SET is_active = false 
  WHERE is_active = true;

  -- Insert new active configuration
  INSERT INTO public.pricing_config (
    surfboard_cost_per_board,
    baggage_free_items_per_passenger,
    baggage_terminal3_curbside_cost,
    baggage_other_terminals_cost,
    currency,
    effective_date,
    created_by,
    is_active
  ) VALUES (
    p_surfboard_cost,
    2, -- Keep free items per passenger constant
    p_terminal3_cost,
    p_other_terminals_cost,
    'IDR',
    NOW(),
    p_created_by,
    true
  );
END;
$$;

-- Grant execute permission to authenticated users (admin access will be controlled by RLS)
GRANT EXECUTE ON FUNCTION public.update_pricing_configuration(DECIMAL, DECIMAL, DECIMAL, VARCHAR) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.update_pricing_configuration IS 'Atomically updates pricing configuration by deactivating old configs and creating a new active one.';