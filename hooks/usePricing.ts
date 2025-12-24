"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  calculateBookingPricing, 
  calculateBookingPricingSync,
  type PricingCalculationInput,
  type PricingCalculationResult,
  type PricingConfig
} from '@/lib/pricing'

interface UsePricingOptions {
  debounceMs?: number
  enableRealTimeUpdates?: boolean
}

interface UsePricingReturn {
  pricing: Omit<PricingCalculationResult, 'config'> | null
  config: PricingConfig | null
  loading: boolean
  error: string | null
  calculatePricing: (input: PricingCalculationInput) => void
  clearError: () => void
}

/**
 * Hook for real-time pricing calculations with debounced updates
 */
export function usePricing(options: UsePricingOptions = {}): UsePricingReturn {
  const {
    debounceMs = 300,
    enableRealTimeUpdates = true
  } = options

  const [pricing, setPricing] = useState<Omit<PricingCalculationResult, 'config'> | null>(null)
  const [config, setConfig] = useState<PricingConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Refs for debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastInputRef = useRef<PricingCalculationInput | null>(null)
  const isInitializedRef = useRef(false)

  /**
   * Clear any existing debounce timeout
   */
  const clearDebounceTimeout = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }
  }, [])

  /**
   * Perform the actual pricing calculation
   */
  const performCalculation = useCallback(async (input: PricingCalculationInput) => {
    try {
      setLoading(true)
      setError(null)

      // First, update immediately with sync calculation for better UX
      if (enableRealTimeUpdates) {
        const syncResult = calculateBookingPricingSync(input)
        setPricing(syncResult)
      }

      // Then perform async calculation with fresh config
      const result = await calculateBookingPricing(input)
      setPricing({
        surfboardCost: result.surfboardCost,
        baggageCost: result.baggageCost,
        totalCost: result.totalCost,
        breakdown: result.breakdown
      })
      setConfig(result.config)
    } catch (err) {
      console.error('Pricing calculation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate pricing')
    } finally {
      setLoading(false)
    }
  }, [enableRealTimeUpdates])

  /**
   * Calculate pricing with debouncing
   */
  const calculatePricing = useCallback((input: PricingCalculationInput) => {
    // Store the latest input
    lastInputRef.current = input

    // Clear any existing timeout
    clearDebounceTimeout()

    // If this is the first calculation or real-time updates are disabled, calculate immediately
    if (!isInitializedRef.current || !enableRealTimeUpdates) {
      isInitializedRef.current = true
      performCalculation(input)
      return
    }

    // Otherwise, debounce the calculation
    debounceTimeoutRef.current = setTimeout(() => {
      if (lastInputRef.current) {
        performCalculation(lastInputRef.current)
      }
    }, debounceMs)
  }, [debounceMs, enableRealTimeUpdates, performCalculation, clearDebounceTimeout])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearDebounceTimeout()
    }
  }, [clearDebounceTimeout])

  return {
    pricing,
    config,
    loading,
    error,
    calculatePricing,
    clearError
  }
}

/**
 * Hook for simple pricing calculation without debouncing
 * Useful for one-time calculations or when you want immediate results
 */
export function usePricingCalculation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculate = useCallback(async (input: PricingCalculationInput): Promise<PricingCalculationResult | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await calculateBookingPricing(input)
      return result
    } catch (err) {
      console.error('Pricing calculation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate pricing')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    calculate,
    loading,
    error,
    clearError
  }
}

/**
 * Hook for managing pricing state in forms
 * Provides convenient state management for form components
 */
export function usePricingState(initialInput?: Partial<PricingCalculationInput>) {
  const [surfboardCount, setSurfboardCount] = useState(initialInput?.surfboardCount ?? 0)
  const [hasExcessBaggage, setHasExcessBaggage] = useState(initialInput?.hasExcessBaggage ?? false)
  const [terminalCode, setTerminalCode] = useState<string | undefined>(initialInput?.terminalCode)
  const [passengerCount, setPassengerCount] = useState(initialInput?.passengerCount ?? 1)

  const { pricing, config, loading, error, calculatePricing, clearError } = usePricing()

  // Recalculate pricing when any input changes
  useEffect(() => {
    const input: PricingCalculationInput = {
      surfboardCount,
      hasExcessBaggage,
      terminalCode,
      passengerCount
    }
    calculatePricing(input)
  }, [surfboardCount, hasExcessBaggage, terminalCode, passengerCount, calculatePricing])

  return {
    // State
    surfboardCount,
    hasExcessBaggage,
    terminalCode,
    passengerCount,
    
    // State setters
    setSurfboardCount,
    setHasExcessBaggage,
    setTerminalCode,
    setPassengerCount,
    
    // Pricing results
    pricing,
    config,
    loading,
    error,
    clearError,
    
    // Convenience getters
    hasSurfboard: surfboardCount > 0,
    totalCost: pricing?.totalCost ?? 0,
    
    // Convenience methods for backward compatibility
    excessBaggageCount: hasExcessBaggage ? 1 : 0, // For backward compatibility
    setExcessBaggageCount: (count: number) => setHasExcessBaggage(count > 0), // For backward compatibility
    
    // Convenience methods
    resetPricing: () => {
      setSurfboardCount(0)
      setHasExcessBaggage(false)
      setTerminalCode(undefined)
    }
  }
}