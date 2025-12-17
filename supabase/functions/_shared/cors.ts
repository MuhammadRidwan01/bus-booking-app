/**
 * CORS Headers Utility for Edge Functions
 * 
 * Provides standardized CORS headers for Edge Function responses
 * to allow frontend applications to make cross-origin requests.
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Handle CORS preflight requests
 * 
 * @returns Response with CORS headers for OPTIONS requests
 */
export function handleCorsPreFlight(): Response {
  return new Response('ok', {
    status: 200,
    headers: corsHeaders,
  })
}

/**
 * Create a JSON response with CORS headers
 * 
 * @param data - The data to return in the response body
 * @param status - HTTP status code (default: 200)
 * @returns Response with JSON body and CORS headers
 */
export function corsJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
