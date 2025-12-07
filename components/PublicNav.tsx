"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Ticket } from "lucide-react"

type Props = {
  ctaHref?: string
  ctaLabel?: string
  showBack?: boolean
  backHref?: string
}

export function PublicNav({ ctaHref = "/booking/ibis-style", ctaLabel = "Book now", showBack = false, backHref = "/" }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          {showBack ? (
            <Link href={backHref}>
              <Button variant="ghost" size="sm" className="rounded-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          ) : null}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/ISJA-IBJA-Logo-updated.png" alt="Ibis Hotels" width={120} height={32} className="h-8 w-auto" />
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Jakarta Airport</p>
              <p className="text-sm font-semibold text-slate-900">Shuttle Service</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/track">
            <Button variant="outline" size="sm" className="rounded-full border-slate-200">
              <Ticket className="mr-2 h-4 w-4" />
              Track ticket
            </Button>
          </Link>
          <Link href={ctaHref}>
            <Button size="sm" className="rounded-full shadow-sm">
              {ctaLabel}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
