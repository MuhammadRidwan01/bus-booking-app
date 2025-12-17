/**
 * Error Handling Utility for Edge Functions
 * 
 * Provides standardized error responses that don't leak internal details.
 * Follows security best practice: generic messages to clients, detailed logs server-side.
 */

import { corsJsonResponse } from './cors.ts'

export interface ErrorResponse {
  ok: false
  error: string
  code?: string
}

/**
 * Standard error codes for consistent error handling
 */
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * Create a standardized error response
 * 
 * @param message - User-facing error message (should be generic)
 * @param status - HTTP status code
 * @param code - Optional error code for client-side handling
 * @returns Response with error details
 */
export function createErrorResponse(
  message: string,
  status: number,
  code?: ErrorCode
): Response {
  const errorBody: ErrorResponse = {
    ok: false,
    error: message,
  }

  if (code) {
    errorBody.code = code
  }

  return corsJsonResponse(errorBody, status)
}

/**
 * Handle authentication errors (401)
 */
export function unauthorizedError(message = 'Authentication required'): Response {
  return createErrorResponse(message, 401, ErrorCode.UNAUTHORIZED)
}

/**
 * Handle authorization errors (403)
 */
export function forbiddenError(message = 'Access denied'): Response {
  return createErrorResponse(message, 403, ErrorCode.FORBIDDEN)
}

/**
 * Handle validation errors (400)
 */
export function validationError(message = 'Invalid request data'): Response {
  return createErrorResponse(message, 400, ErrorCode.VALIDATION_ERROR)
}

/**
 * Handle not found errors (404)
 */
export function notFoundError(message = 'Resource not found'): Response {
  return createErrorResponse(message, 404, ErrorCode.NOT_FOUND)
}

/**
 * Handle rate limit errors (429)
 */
export function rateLimitError(message = 'Too many requests, please try again later'): Response {
  return createErrorResponse(message, 429, ErrorCode.RATE_LIMITED)
}

/**
 * Handle internal server errors (500)
 * IMPORTANT: Never expose internal details in the message
 */
export function internalError(message = 'Unable to process request'): Response {
  return createErrorResponse(message, 500, ErrorCode.INTERNAL_ERROR)
}

/**
 * Safe error handler that logs details server-side but returns generic message
 * 
 * @param error - The error that occurred
 * @param context - Additional context for logging (e.g., function name, request ID)
 * @returns Generic error response
 */
export function handleError(error: unknown, context?: string): Response {
  // Log detailed error server-side (visible in Supabase logs)
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined
  
  console.error('[Error Handler]', {
    context,
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
  })

  // Return generic error to client (no internal details)
  return internalError()
}

/**
 * Validate request body and return typed data or error
 * 
 * @param req - The incoming request
 * @returns Parsed JSON body or null if invalid
 */
export async function parseRequestBody<T = unknown>(req: Request): Promise<T | null> {
  try {
    const contentType = req.headers.get('content-type')
    
    if (!contentType?.includes('application/json')) {
      return null
    }

    const body = await req.json()
    return body as T
  } catch {
    return null
  }
}

/**
 * Validate required fields in request body
 * 
 * @param body - The request body
 * @param requiredFields - Array of required field names
 * @returns Array of missing field names, empty if all present
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): string[] {
  const missing: string[] = []

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      missing.push(field)
    }
  }

  return missing
}

/**
 * Create validation error response with field details
 * 
 * @param missingFields - Array of missing field names
 * @returns Validation error response
 */
export function createValidationErrorResponse(missingFields: string[]): Response {
  const message = `Missing required fields: ${missingFields.join(', ')}`
  return validationError(message)
}

/**
 * Log request for debugging (sanitized)
 * 
 * @param req - The incoming request
 * @param additionalInfo - Additional info to log
 */
export function logRequest(req: Request, additionalInfo?: Record<string, unknown>): void {
  const url = new URL(req.url)
  
  console.log('[Request]', {
    method: req.method,
    path: url.pathname,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  })
}

/**
 * Sanitize error for logging (remove sensitive data)
 * 
 * @param error - The error to sanitize
 * @returns Sanitized error object
 */
export function sanitizeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      // Don't include stack in production logs if it might contain sensitive data
    }
  }

  return {
    error: String(error),
  }
}
