"use client"

import type { ReactNode } from "react"
import { PublicNav } from "./PublicNav"

type Props = {
  children: ReactNode
  showBack?: boolean
  backHref?: string
}

export function PublicShell({ children, showBack = false, backHref = "/" }: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav showBack={showBack} backHref={backHref} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">{children}</main>
    </div>
  )
}
