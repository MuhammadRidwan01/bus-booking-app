import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAdminSession } from "@/lib/admin-auth"
import { createClient } from "@supabase/supabase-js"
import { clientConfig } from "@/lib/supabase-config"

const bodySchema = z.object({
  hotelId: z.string().uuid(),
  dailyScheduleId: z.string().uuid(),
  customerName: z.string().min(1),
  phoneNumber: z.string().min(5),
  passengerCount: z.number().int().positive().max(5),
  roomNumber: z.string().min(1),
})

export async function POST(req: NextRequest) {
  // Check admin authentication
  const session = await getAdminSession()
  const adminSecret = process.env.ADMIN_SECRET
  const url = new URL(req.url)
  const key = url.searchParams.get("key") || req.cookies.get("admin_key")?.value
  if (!session && adminSecret && key !== adminSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  let parsedBody: z.infer<typeof bodySchema>
  try {
    const json = await req.json()
    parsedBody = bodySchema.parse(json)
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 })
  }

  try {
    // Create Supabase client to get admin JWT token
    const supabase = createClient(clientConfig.supabaseUrl, clientConfig.supabaseAnonKey)
    const { data: { session: supabaseSession } } = await supabase.auth.getSession()

    // Call Edge Function
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-booking`
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseSession?.access_token || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parsedBody)
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || 'Failed to create booking' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      ok: true,
      data: result.data,
      whatsappSent: result.whatsappSent
    })
  } catch (error) {
    console.error("Admin booking proxy error:", error)
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
