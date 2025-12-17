/**
 * JWT Authentication Utility for Edge Functions
 * 
 * Provides JWT token validation and user authentication
 * for securing Edge Function endpoints.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface AuthResult {
  authenticated: boolean
  userId?: string
  email?: string
  role?: string
  error?: string
}

/**
 * Validate JWT token from Authorization header
 * 
 * @param authHeader - The Authorization header value (e.g., "Bearer <token>")
 * @param supabaseUrl - Supabase project URL
 * @param supabaseAnonKey - Supabase anon key
 * @returns AuthResult with authentication status and user info
 */
export async function validateJWT(
  authHeader: string | null,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<AuthResult> {
  if (!authHeader) {
    return {
      authenticated: false,
      error: 'Missing authorization header',
    }
  }

  // Extract token from "Bearer <token>" format
  const token = authHeader.replace('Bearer ', '').trim()
  
  if (!token) {
    return {
      authenticated: false,
      error: 'Invalid authorization header format',
    }
  }

  try {
    // Create Supabase client with the user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    // Verify the token and get user info
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return {
        authenticated: false,
        error: error?.message || 'Invalid token',
      }
    }

    return {
      authenticated: true,
      userId: user.id,
      email: user.email,
      role: user.role,
    }
  } catch (error) {
    return {
      authenticated: false,
      error: 'Token validation failed',
    }
  }
}

/**
 * Validate admin JWT token and verify admin role
 * 
 * @param authHeader - The Authorization header value
 * @param supabaseUrl - Supabase project URL
 * @param supabaseServiceKey - Supabase service role key
 * @returns AuthResult with authentication status and admin verification
 */
export async function validateAdminJWT(
  authHeader: string | null,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<AuthResult> {
  if (!authHeader) {
    return {
      authenticated: false,
      error: 'Missing authorization header',
    }
  }

  const token = authHeader.replace('Bearer ', '').trim()
  
  if (!token) {
    return {
      authenticated: false,
      error: 'Invalid authorization header format',
    }
  }

  try {
    // Create Supabase client with service role key to verify admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the token
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return {
        authenticated: false,
        error: error?.message || 'Invalid token',
      }
    }

    // Check if user has admin role
    // This assumes admin users are stored in admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('email', user.email)
      .single()

    if (adminError || !adminUser) {
      return {
        authenticated: false,
        error: 'User is not an administrator',
      }
    }

    return {
      authenticated: true,
      userId: user.id,
      email: user.email,
      role: adminUser.role,
    }
  } catch (error) {
    return {
      authenticated: false,
      error: 'Admin token validation failed',
    }
  }
}

/**
 * Extract JWT token from request
 * 
 * @param req - The incoming request
 * @returns The JWT token or null if not found
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null
  
  return authHeader.replace('Bearer ', '').trim()
}
