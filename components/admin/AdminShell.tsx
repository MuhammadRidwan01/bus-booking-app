"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Gauge, Bus, Calendar, Building2, Wrench, NotebookText } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import CommandPalette from "./CommandPalette"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/bookings", label: "Bookings", icon: NotebookText },
  { href: "/admin/schedules", label: "Schedules", icon: Calendar },
  { href: "/admin/bus-schedules", label: "Bus Schedules", icon: Bus },
  { href: "/admin/hotels", label: "Hotels", icon: Building2 },
  { href: "/admin/tools", label: "Tools", icon: Wrench },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600" />
          <div>
            <p className="text-lg font-bold">Shuttle Admin</p>
            <Badge variant="secondary" className="text-[11px]">Admin</Badge>
          </div>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="py-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={onNavigate}>
                <div
                  className={cn(
                    "mx-2 mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="hidden w-64 border-r bg-white lg:block">
          <Sidebar />
        </aside>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute left-3 top-3 lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <Sidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <main className="flex-1">
          <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3 lg:px-6">
              <div>
                <p className="text-sm text-gray-500">Shuttle Admin</p>
                <h1 className="text-xl font-bold">Control Panel</h1>
              </div>
              <div className="flex items-center gap-2">
                <CommandPalette />
              </div>
            </div>
          </header>

          <div className="px-4 py-6 lg:px-6">{children}</div>
        </main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
