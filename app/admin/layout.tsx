import { headers } from "next/headers"
import { redirect } from "next/navigation"
import AdminShell from "@/components/admin/AdminShell"
import { getAdminSession } from "@/lib/admin-auth"

export const metadata = {
  title: "Admin | Shuttle",
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers()
  const rawUrl = hdrs.get("x-url") || ""
  const isLoginPage = rawUrl.includes("/admin/login")
  const session = await getAdminSession()

  if (isLoginPage) {
    if (session) redirect("/admin")
    return <>{children}</>
  }

  if (!session) {
    redirect("/admin/login")
  }

  return <AdminShell>{children}</AdminShell>
}
