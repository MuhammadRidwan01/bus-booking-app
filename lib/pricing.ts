import { supabase } from "@/lib/supabase-browser"
import {
  calculateSurfboardCost,
  calculateBaggageCost,
  calculateTotalCost
} from "@/lib/validations"

// Types for pricing configuration
export interface PricingConfig {
  id: string
  surfboardCostPerBoard: number
  baggageFreeItemsPerPassenger: number
  baggageTerminal3CurbsideCost: number
  baggageOtherTerminalsCost: number
  currency: string
  effectiveDate: string
  createdBy: string
  createdAt: string
  isActive: boolean
}

// Types for pricing calculation
export interface PricingCalculationInput {
  surfboardCount: number
  hasExcessBaggage: boolean
  terminalCode?: string
  passengerCount?: number
}

export interface PricingCalculationResult {
  surfboardCost: number
  baggageCost: number
  totalCost: number
  breakdown: PricingBreakdownItem[]
  config: PricingConfig
}

export interface PricingBreakdownItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

// Cache for pricing configuration to avoid repeated database calls
let pricingConfigCache: PricingConfig | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get the active pricing configuration from database or cache
 */
export async function getActivePricingConfig(): Promise<PricingConfig> {
  const now = Date.now()

  // Return cached config if still valid
  if (pricingConfigCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return pricingConfigCache
  }

  try {
    const { data, error } = await supabase
      .from('pricing_config')
      .select('*')
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching pricing config:', error)
      // Return default configuration if database fails
      return getDefaultPricingConfig()
    }

    if (!data) {
      console.warn('No active pricing configuration found, using defaults')
      return getDefaultPricingConfig()
    }

    // Map snake_case to camelCase
    const mappedConfig: PricingConfig = {
      id: data.id,
      surfboardCostPerBoard: data.surfboard_cost_per_board,
      baggageFreeItemsPerPassenger: data.baggage_free_items_per_passenger,
      baggageTerminal3CurbsideCost: data.baggage_terminal_3_curbside_cost,
      baggageOtherTerminalsCost: data.baggage_other_terminals_cost,
      currency: data.currency,
      effectiveDate: data.effective_date,
      createdBy: data.created_by,
      createdAt: data.created_at,
      isActive: data.is_active
    }

    // Update cache
    pricingConfigCache = mappedConfig
    cacheTimestamp = now

    return mappedConfig
  } catch (error) {
    console.error('Error in getActivePricingConfig:', error)
    return getDefaultPricingConfig()
  }
}

/**
 * Get default pricing configuration as fallback
 */
function getDefaultPricingConfig(): PricingConfig {
  return {
    id: 'default',
    surfboardCostPerBoard: 75000,
    baggageFreeItemsPerPassenger: 2,
    baggageTerminal3CurbsideCost: 150000,
    baggageOtherTerminalsCost: 75000,
    currency: 'IDR',
    effectiveDate: new Date().toISOString(),
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    isActive: true
  }
}

/**
 * Calculate pricing for booking with real-time configuration
 */
export async function calculateBookingPricing(
  input: PricingCalculationInput
): Promise<PricingCalculationResult> {
  const config = await getActivePricingConfig()

  // Calculate costs using the configuration
  const surfboardCost = calculateSurfboardCost(
    input.surfboardCount,
    config.surfboardCostPerBoard
  )

  const baggageCost = calculateBaggageCost(
    input.hasExcessBaggage,
    input.terminalCode,
    config.baggageTerminal3CurbsideCost,
    config.baggageOtherTerminalsCost
  )

  const totalCost = calculateTotalCost(surfboardCost, baggageCost)

  // Generate breakdown items
  const breakdown: PricingBreakdownItem[] = []

  if (input.surfboardCount > 0) {
    breakdown.push({
      description: `Surfboard handling (${input.surfboardCount} board${input.surfboardCount > 1 ? 's' : ''})`,
      quantity: input.surfboardCount,
      unitPrice: config.surfboardCostPerBoard,
      totalPrice: surfboardCost
    })
  }

  if (input.hasExcessBaggage) {
    const isTerminal3 = input.terminalCode === 'Terminal 3' ||
      input.terminalCode === 'terminal3' ||
      input.terminalCode === 'T3'
    const unitPrice = isTerminal3 ?
      config.baggageTerminal3CurbsideCost :
      config.baggageOtherTerminalsCost

    const terminalDescription = input.terminalCode ?
      ` (${input.terminalCode})` :
      ' (terminal-dependent)'

    breakdown.push({
      description: `Excess baggage${terminalDescription}`,
      quantity: 1, // Baggage cost is per trip, not per item
      unitPrice: unitPrice,
      totalPrice: baggageCost
    })
  }

  return {
    surfboardCost,
    baggageCost,
    totalCost,
    breakdown,
    config
  }
}

/**
 * Calculate pricing synchronously using cached configuration or defaults
 * Useful for immediate UI updates while async calculation runs in background
 */
export function calculateBookingPricingSync(
  input: PricingCalculationInput
): Omit<PricingCalculationResult, 'config'> {
  const config = pricingConfigCache || getDefaultPricingConfig()

  const surfboardCost = calculateSurfboardCost(
    input.surfboardCount,
    config.surfboardCostPerBoard
  )

  const baggageCost = calculateBaggageCost(
    input.hasExcessBaggage,
    input.terminalCode,
    config.baggageTerminal3CurbsideCost,
    config.baggageOtherTerminalsCost
  )

  const totalCost = calculateTotalCost(surfboardCost, baggageCost)

  // Generate breakdown items
  const breakdown: PricingBreakdownItem[] = []

  if (input.surfboardCount > 0) {
    breakdown.push({
      description: `Surfboard handling (${input.surfboardCount} board${input.surfboardCount > 1 ? 's' : ''})`,
      quantity: input.surfboardCount,
      unitPrice: config.surfboardCostPerBoard,
      totalPrice: surfboardCost
    })
  }

  if (input.hasExcessBaggage) {
    const isTerminal3 = input.terminalCode === 'Terminal 3' ||
      input.terminalCode === 'terminal3' ||
      input.terminalCode === 'T3'
    const unitPrice = isTerminal3 ?
      config.baggageTerminal3CurbsideCost :
      config.baggageOtherTerminalsCost

    const terminalDescription = input.terminalCode ?
      ` (${input.terminalCode})` :
      ' (terminal-dependent)'

    breakdown.push({
      description: `Excess baggage${terminalDescription}`,
      quantity: 1,
      unitPrice: unitPrice,
      totalPrice: baggageCost
    })
  }

  return {
    surfboardCost,
    baggageCost,
    totalCost,
    breakdown
  }
}

/**
 * Format currency amount using Indonesian locale
 */
export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Validate pricing calculation against configuration
 */
export async function validatePricingCalculation(
  input: PricingCalculationInput,
  expectedSurfboardCost: number,
  expectedBaggageCost: number,
  expectedTotalCost: number
): Promise<{ isValid: boolean; errors: string[] }> {
  const result = await calculateBookingPricing(input)
  const errors: string[] = []
  const tolerance = 0.01 // Allow for floating point precision

  if (Math.abs(result.surfboardCost - expectedSurfboardCost) > tolerance) {
    errors.push(`Surfboard cost mismatch: expected ${expectedSurfboardCost}, got ${result.surfboardCost}`)
  }

  if (Math.abs(result.baggageCost - expectedBaggageCost) > tolerance) {
    errors.push(`Baggage cost mismatch: expected ${expectedBaggageCost}, got ${result.baggageCost}`)
  }

  if (Math.abs(result.totalCost - expectedTotalCost) > tolerance) {
    errors.push(`Total cost mismatch: expected ${expectedTotalCost}, got ${result.totalCost}`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Clear pricing configuration cache (useful for admin updates)
 */
export function clearPricingCache(): void {
  pricingConfigCache = null
  cacheTimestamp = 0
}

/**
 * Preload pricing configuration (useful for initialization)
 */
export async function preloadPricingConfig(): Promise<void> {
  try {
    await getActivePricingConfig()
  } catch (error) {
    console.warn('Failed to preload pricing configuration:', error)
  }
}