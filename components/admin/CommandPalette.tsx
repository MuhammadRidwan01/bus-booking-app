"use client"

import { useEffect, useState, useTransition } from "react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { quickSearch } from "@/app/admin/actions"
import { useRouter } from "next/navigation"

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ bookings: any[]; hotels: any[] }>({ bookings: [], hotels: [] })
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    if (!query) {
      startTransition(() => setResults({ bookings: [], hotels: [] }))
      return
    }
    startTransition(async () => {
      const data = await quickSearch(query)
      if (!cancelled) {
        setResults(data)
      }
    })
    return () => {
      cancelled = true
    }
  }, [open, query, startTransition])

  const goToBooking = (code: string) => {
    setOpen(false)
    router.push(`/admin/bookings?search=${encodeURIComponent(code)}`)
  }

  const goToHotel = (id: string) => {
    setOpen(false)
    router.push(`/admin/schedules?hotelId=${id}`)
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Search className="h-4 w-4" />
        Search (Ctrl+K)
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Cari booking code / phone / hotel"
        />
        <CommandList>
          <CommandEmpty>No results</CommandEmpty>
          {results.bookings.length > 0 && (
            <CommandGroup heading="Bookings">
              {results.bookings.map((b) => (
                <CommandItem key={b.id} onSelect={() => goToBooking(b.booking_code)}>
                  <div className="flex flex-col">
                    <span className="font-semibold">{b.booking_code}</span>
                    <span className="text-xs text-gray-500">{b.customer_name} · {b.phone}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results.hotels.length > 0 && (
            <CommandGroup heading="Hotels">
              {results.hotels.map((h) => (
                <CommandItem key={h.id} onSelect={() => goToHotel(h.id)}>
                  {h.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
