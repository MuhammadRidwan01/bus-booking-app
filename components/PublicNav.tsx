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
  hideCta?: boolean
}

export function PublicNav({
  ctaHref = "/booking/ibis-style",
  ctaLabel = "Book now",
  showBack = false,
  backHref = "/",
  hideCta = false,
}: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <Link href={backHref} className="flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full sm:w-auto sm:px-3"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="ml-1 hidden text-xs sm:inline">Back</span>
              </Button>
            </Link>
          )}

          <Link href="/" className="flex min-w-0 items-center gap-2">
            {/* HIDE LOGO ON MOBILE */}
            <Image
              src="/ISJA-IBJA-Logo-updated.png"
              alt="Ibis Hotels"
              width={120}
              height={32}
              className="hidden h-8 w-auto sm:block"
            />

            {/* TEXT ALWAYS SHOWS */}
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 sm:text-[11px]">
                Jakarta Airport
              </p>
              <p className="text-xs font-semibold text-slate-900 sm:text-sm">
                Shuttle Service
              </p>
            </div>
          </Link>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/track">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-slate-200 px-2 text-xs sm:px-3 sm:text-sm"
            >
              <Ticket className="mr-0 h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Track ticket</span>
            </Button>
          </Link>

          {!hideCta && (
            <Link href={ctaHref}>
              <Button
                size="sm"
                className="h-8 rounded-full px-3 text-xs shadow-sm sm:px-4 sm:text-sm"
              >
                {ctaLabel}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
