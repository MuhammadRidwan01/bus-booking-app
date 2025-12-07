import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { clientConfig } from "@/lib/supabase-config"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.json({ ok: false, error: "Booking code is required" }, { status: 400 })
  }

  try {
    // Create Supabase client to get session
    const supabase = createClient(clientConfig.supabaseUrl, clientConfig.supabaseAnonKey)
    const { data: { session } } = await supabase.auth.getSession()

    // Call Edge Function
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/booking-status?code=${encodeURIComponent(code)}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    // Include JWT if available (but not required for public access)
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'GET',
      headers
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || 'Failed to get booking status' },
        { status: response.status }
      )
    }

    // Return the same format as before for backward compatibility
    return NextResponse.json({
      ok: true,
      data: {
        whatsapp_sent: result.data?.whatsapp_sent,
        whatsapp_attempts: result.data?.whatsapp_attempts ?? 0,
        whatsapp_last_error: result.data?.whatsapp_last_error,
      },
    })
  } catch (error) {
    console.error("booking-status proxy error", error)
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 })
  }
}
