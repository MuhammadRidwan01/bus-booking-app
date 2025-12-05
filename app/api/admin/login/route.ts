import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { hashPassword, setAdminSessionCookie } from "@/lib/admin-auth"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof schema>
  try {
    const body = await req.json()
    parsed = schema.parse(body)
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 })
  }

  const supabase = await getSupabaseAdmin()
  const { data: user } = await supabase
    .from("admin_users")
    .select("id, email, role, password_hash, salt, is_active")
    .eq("email", parsed.email.toLowerCase())
    .single()

  if (!user || !user.is_active) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 })
  }

  const hashed = hashPassword(parsed.password, (user as any).salt)
  if (hashed !== (user as any).password_hash) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 })
  }

  const session = {
    id: (user as any).id,
    email: (user as any).email,
    role: (user as any).role ?? "admin",
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  }

  const res = NextResponse.json({ ok: true, user: { id: session.id, email: session.email, role: session.role } })
  setAdminSessionCookie(res, session)
  return res
}
