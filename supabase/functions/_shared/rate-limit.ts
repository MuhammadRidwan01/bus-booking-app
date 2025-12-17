/**
 * Rate Limiting Utility for Edge Functions
 * 
 * Provides in-memory rate limiting to prevent abuse and excessive requests.
 * Note: This is a simple in-memory implementation. For production at scale,
 * consider using Redis or a dedicated rate limiting service.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// Key format: "ip:endpoint" or "userId:endpoint"
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  identifier: string // IP address or user ID
  endpoint: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * Check if a request should be rate limited
 * 
 * @param config - Rate limit configuration
 * @returns RateLimitResult indicating if request is allowed
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const { maxRequests, windowMs, identifier, endpoint } = config
  const key = `${identifier}:${endpoint}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // If no entry exists or window has expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, entry)

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: entry.resetTime,
    }
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  if (entry.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000), // seconds
    }
  }

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Extract client identifier from request
 * Tries to get real IP from various headers, falls back to connection info
 * 
 * @param req - The incoming request
 * @returns Client identifier (IP address)
 */
export function getClientIdentifier(req: Request): string {
  // Try to get real IP from common proxy headers
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  const cfConnectingIp = req.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Fallback to a generic identifier
  return 'unknown'
}

/**
 * Create a rate limit response
 * 
 * @param result - Rate limit result
 * @returns Response with 429 status and rate limit headers
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error: 'Too many requests, please try again later',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(result.remaining + (result.allowed ? 1 : 0)),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        'Retry-After': String(result.retryAfter || 60),
      },
    }
  )
}

/**
 * Middleware to apply rate limiting to Edge Function
 * 
 * @param req - The incoming request
 * @param maxRequests - Maximum requests allowed in window
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param endpoint - Endpoint identifier for rate limiting
 * @returns RateLimitResult or null if allowed
 */
export function applyRateLimit(
  req: Request,
  maxRequests: number,
  windowMs = 60000,
  endpoint = 'default'
): RateLimitResult {
  const identifier = getClientIdentifier(req)
  
  return checkRateLimit({
    maxRequests,
    windowMs,
    identifier,
    endpoint,
  })
}
