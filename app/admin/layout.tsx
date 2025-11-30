import { cookies, headers } from "next/headers"
import AdminShell from "@/components/admin/AdminShell"

export const metadata = {
  title: "Admin | Shuttle",
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminSecret = process.env.ADMIN_SECRET
  const hdrs = await headers()
  const rawUrl = hdrs.get("x-url")
  const cookieStore = await cookies()

  let authorized = true
  if (adminSecret) {
    try {
      const parsed = rawUrl ? new URL(rawUrl) : null
      const key = parsed?.searchParams.get("key") || cookieStore.get("admin_key")?.value
      authorized = key === adminSecret
    } catch {
      authorized = false
    }
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-red-600">Unauthorized admin key</h1>
          <p className="mt-3 text-sm text-gray-600">Tambahkan query ?key=... sesuai ADMIN_SECRET untuk akses.</p>
        </div>
      </div>
    )
  }

  return <AdminShell>{children}</AdminShell>
}
