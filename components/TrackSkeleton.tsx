import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Bus, Download } from "lucide-react"

export default function TrackSkeleton() {
  return (
    <Card className="overflow-hidden border border-slate-100 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <CardTitle className="flex items-center gap-2">
          <Bus className="h-5 w-5" />
          Ticket details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white shadow-inner">
          <div className="h-5 w-28 rounded bg-white/30 animate-pulse" />
          <div className="mt-3 h-10 w-48 font-mono text-3xl font-bold tracking-[0.2em]">
            <div className="h-8 w-80 rounded bg-white/30 animate-pulse" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="h-16 rounded-xl bg-white/90 p-3 shadow-sm animate-pulse" />
            <div className="h-16 rounded-xl bg-white/90 p-3 shadow-sm animate-pulse" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="h-16 rounded-xl bg-white/90 p-3 shadow-sm animate-pulse" />
            <div className="h-16 rounded-xl bg-white/90 p-3 shadow-sm animate-pulse" />
            <div className="h-16 rounded-xl bg-white/90 p-3 shadow-sm animate-pulse" />
            <div className="h-16 rounded-xl bg-white/90 p-3 shadow-sm animate-pulse" />
          </div>

          <div className="h-36 rounded-xl border border-slate-200 bg-slate-50 p-4 animate-pulse" />
        </div>

        <div className="w-full">
          <div className="h-11 w-full rounded-xl bg-slate-200 animate-pulse flex items-center justify-center gap-2">
            <Download className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
