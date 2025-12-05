import { cookies } from "next/headers"
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { adminConfig } from "./supabase-config"

const SESSION_COOKIE = "admin_session"
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type AdminSession = { id: string; email: string; role: string; exp: number }

function sign(payload: AdminSession) {
  const secret = adminConfig.supabaseServiceRoleKey || process.env.ADMIN_SECRET || "change-me"
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig = createHmac("sha256", secret).update(body).digest("base64url")
  return `${body}.${sig}`
}

function verify(token: string | undefined | null): AdminSession | null {
  if (!token) return null
  const [body, sig] = token.split(".")
  if (!body || !sig) return null
  const secret = adminConfig.supabaseServiceRoleKey || process.env.ADMIN_SECRET || "change-me"
  const expected = createHmac("sha256", secret).update(body).digest("base64url")
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch {
    return null
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as AdminSession
  if (!payload.exp || Date.now() > payload.exp) return null
  return payload
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  return verify(token)
}

export function setAdminSessionCookie(res: { cookies: any }, session: AdminSession) {
  res.cookies.set(SESSION_COOKIE, sign(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export function clearAdminSessionCookie(res: { cookies: any }) {
  res.cookies.delete(SESSION_COOKIE)
}

export function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex")
}

export function generateSalt() {
  return randomBytes(16).toString("hex")
}
