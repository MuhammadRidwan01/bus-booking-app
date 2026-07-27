"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { clearPricingCache } from "@/lib/pricing"
import { getAdminSession } from "@/lib/admin-auth"
import { z } from "zod"

// Validation schema for pricing updates
const PricingUpdateSchema = z.object({
  surfboard_cost_per_board: z.number()
    .min(0, "Surfboard cost cannot be negative")
    .max(1000000, "Surfboard cost seems unreasonably high")
    .int("Surfboard cost must be a whole number"),
  baggage_terminal3_curbside_cost: z.number()
    .min(0, "Terminal 3 baggage cost cannot be negative")
    .max(1000000, "Terminal 3 baggage cost seems unreasonably high")
    .int("Terminal 3 baggage cost must be a whole number"),
  baggage_other_terminals_cost: z.number()
    .min(0, "Other terminals baggage cost cannot be negative")
    .max(1000000, "Other terminals baggage cost seems unreasonably high")
    .int("Other terminals baggage cost must be a whole number"),
})

// Log admin actions for audit trail with enhanced metadata
async function logAdminAction(action: string, meta?: Record<string, unknown>) {
  try {
    const supabase = await getSupabaseAdmin()
    const session = await getAdminSession()
    
    await supabase.from("admin_logs").insert({ 
      action, 
      meta: {
        ...meta,
        admin_session: session ? 'authenticated' : 'unauthenticated',
        timestamp: new Date().toISOString(),
        user_agent: process.env.HTTP_USER_AGENT || 'unknown'
      }
    })
  } catch (error) {
    console.error("Failed to log admin action", error)
  }
}

// Check admin authentication for sensitive operations
async function requireAdminAuth() {
  const session = await getAdminSession()
  if (!session) {
    throw new Error("Admin authentication required")
  }
  return session
}

/**
 * Fetch the current active pricing configuration
 */
export async function fetchPricingConfig() {
  try {
    // Admin authentication check
    await requireAdminAuth()
    
    const supabase = await getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('pricing_config')
      .select('*')
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      await logAdminAction("FETCH_PRICING_CONFIG", { ok: false, error: error.message })
      return { ok: false, error: error.message }
    }

    if (!data) {
      await logAdminAction("FETCH_PRICING_CONFIG", { ok: false, error: "No active configuration found" })
      return { ok: false, error: "No active pricing configuration found" }
    }

    await logAdminAction("FETCH_PRICING_CONFIG", { ok: true, config_id: data.id })
    return { ok: true, data }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logAdminAction("FETCH_PRICING_CONFIG", { ok: false, error: errorMessage })
    return { ok: false, error: errorMessage }
  }
}

/**
 * Fetch pricing configuration history
 */
export async function fetchPricingHistory() {
  try {
    // Admin authentication check
    await requireAdminAuth()
    
    const supabase = await getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('pricing_config')
      .select(`
        id,
        surfboard_cost_per_board,
        baggage_terminal3_curbside_cost,
        baggage_other_terminals_cost,
        effective_date,
        created_by,
        created_at,
        is_active
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      await logAdminAction("FETCH_PRICING_HISTORY", { ok: false, error: error.message })
      return { ok: false, error: error.message }
    }

    await logAdminAction("FETCH_PRICING_HISTORY", { ok: true, count: data?.length || 0 })
    return { ok: true, data: data || [] }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logAdminAction("FETCH_PRICING_HISTORY", { ok: false, error: errorMessage })
    return { ok: false, error: errorMessage }
  }
}

/**
 * Update pricing configuration with enhanced validation and audit logging
 */
export async function updatePricingConfig(payload: {
  surfboard_cost_per_board: number
  baggage_terminal3_curbside_cost: number
  baggage_other_terminals_cost: number
}) {
  try {
    // Admin authentication check
    const session = await requireAdminAuth()
    
    // Validate input using Zod schema
    const validationResult = PricingUpdateSchema.safeParse(payload)
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(e => e.message).join(', ')
      await logAdminAction("UPDATE_PRICING_CONFIG", { 
        ok: false, 
        error: `Validation failed: ${errors}`,
        payload 
      })
      return { ok: false, error: `Validation failed: ${errors}` }
    }

    const supabase = await getSupabaseAdmin()
    
    // Get current configuration for comparison
    const { data: currentConfig } = await supabase
      .from('pricing_config')
      .select('*')
      .eq('is_active', true)
      .single()

    // Check if there are actual changes
    if (currentConfig && 
        currentConfig.surfboard_cost_per_board === payload.surfboard_cost_per_board &&
        currentConfig.baggage_terminal3_curbside_cost === payload.baggage_terminal3_curbside_cost &&
        currentConfig.baggage_other_terminals_cost === payload.baggage_other_terminals_cost) {
      await logAdminAction("UPDATE_PRICING_CONFIG", { 
        ok: false, 
        error: "No changes detected",
        payload 
      })
      return { ok: false, error: "No changes detected in pricing configuration" }
    }

    // Start a transaction to ensure consistency
    const { error: transactionError } = await supabase.rpc('update_pricing_configuration', {
      p_surfboard_cost: payload.surfboard_cost_per_board,
      p_terminal3_cost: payload.baggage_terminal3_curbside_cost,
      p_other_terminals_cost: payload.baggage_other_terminals_cost,
      p_created_by: 'admin' // In a real app, this would be the authenticated admin user ID
    })

    if (transactionError) {
      await logAdminAction("UPDATE_PRICING_CONFIG", { 
        ok: false, 
        error: transactionError.message,
        payload,
        admin_session: session ? 'authenticated' : 'unauthenticated'
      })
      return { ok: false, error: transactionError.message }
    }

    // Clear the pricing cache so new configuration takes effect immediately
    clearPricingCache()

    // Log successful update with detailed audit information
    await logAdminAction("UPDATE_PRICING_CONFIG", { 
      ok: true, 
      payload,
      previous_config: currentConfig ? {
        surfboard_cost: currentConfig.surfboard_cost_per_board,
        terminal3_cost: currentConfig.baggage_terminal3_curbside_cost,
        other_terminals_cost: currentConfig.baggage_other_terminals_cost
      } : null,
      created_by: 'admin',
      admin_session: session ? 'authenticated' : 'unauthenticated',
      immediate_effect: true
    })

    // Revalidate relevant pages to ensure immediate application
    revalidatePath("/admin/pricing")
    revalidatePath("/booking")
    revalidatePath("/admin") // Dashboard might show pricing stats

    return { ok: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logAdminAction("UPDATE_PRICING_CONFIG", { 
      ok: false, 
      error: errorMessage,
      payload 
    })
    return { ok: false, error: errorMessage }
  }
}

/**
 * Get pricing statistics for dashboard with admin authentication
 */
export async function fetchPricingStats() {
  try {
    // Admin authentication check
    await requireAdminAuth()
    
    const supabase = await getSupabaseAdmin()
    
    // Get current active configuration
    const { data: currentConfig } = await supabase
      .from('pricing_config')
      .select('*')
      .eq('is_active', true)
      .single()

    // Get count of bookings with additional services in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: surfboardBookings, error: surfboardError } = await supabase
      .from('bookings')
      .select('id, surfboard_cost')
      .eq('has_surfboard', true)
      .gte('created_at', thirtyDaysAgo.toISOString())

    const { data: baggageBookings, error: baggageError } = await supabase
      .from('bookings')
      .select('id, baggage_cost')
      .gt('excess_baggage_count', 0)
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (surfboardError || baggageError) {
      console.warn('Error fetching booking stats:', surfboardError || baggageError)
    }

    const stats = {
      currentConfig,
      surfboardBookingsCount: surfboardBookings?.length || 0,
      baggageBookingsCount: baggageBookings?.length || 0,
      totalSurfboardRevenue: surfboardBookings?.reduce((sum, b) => sum + (b.surfboard_cost || 0), 0) || 0,
      totalBaggageRevenue: baggageBookings?.reduce((sum, b) => sum + (b.baggage_cost || 0), 0) || 0,
    }

    await logAdminAction("FETCH_PRICING_STATS", { ok: true, stats_period: '30_days' })
    return { ok: true, data: stats }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logAdminAction("FETCH_PRICING_STATS", { ok: false, error: errorMessage })
    return { ok: false, error: errorMessage }
  }
}

/**
 * Validate pricing configuration changes before applying
 */
export async function validatePricingUpdate(payload: {
  surfboard_cost_per_board: number
  baggage_terminal3_curbside_cost: number
  baggage_other_terminals_cost: number
}) {
  try {
    // Admin authentication check
    await requireAdminAuth()
    
    // Validate input using Zod schema
    const validationResult = PricingUpdateSchema.safeParse(payload)
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
      return { ok: false, errors }
    }

    // Additional business logic validation
    const warnings: string[] = []
    
    // Check for significant price increases (>50%)
    const supabase = await getSupabaseAdmin()
    const { data: currentConfig } = await supabase
      .from('pricing_config')
      .select('*')
      .eq('is_active', true)
      .single()

    if (currentConfig) {
      const surfboardIncrease = (payload.surfboard_cost_per_board - currentConfig.surfboard_cost_per_board) / currentConfig.surfboard_cost_per_board
      const terminal3Increase = (payload.baggage_terminal3_curbside_cost - currentConfig.baggage_terminal3_curbside_cost) / currentConfig.baggage_terminal3_curbside_cost
      const otherTerminalsIncrease = (payload.baggage_other_terminals_cost - currentConfig.baggage_other_terminals_cost) / currentConfig.baggage_other_terminals_cost

      if (surfboardIncrease > 0.5) {
        warnings.push(`Surfboard cost increase of ${Math.round(surfboardIncrease * 100)}% is significant`)
      }
      if (terminal3Increase > 0.5) {
        warnings.push(`Terminal 3 baggage cost increase of ${Math.round(terminal3Increase * 100)}% is significant`)
      }
      if (otherTerminalsIncrease > 0.5) {
        warnings.push(`Other terminals baggage cost increase of ${Math.round(otherTerminalsIncrease * 100)}% is significant`)
      }
    }

    await logAdminAction("VALIDATE_PRICING_UPDATE", { 
      ok: true, 
      payload,
      warnings_count: warnings.length 
    })

    return { ok: true, warnings }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logAdminAction("VALIDATE_PRICING_UPDATE", { ok: false, error: errorMessage })
    return { ok: false, error: errorMessage }
  }
}