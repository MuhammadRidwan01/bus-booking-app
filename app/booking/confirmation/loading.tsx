import { Card, CardContent } from "@/components/ui/card"
import { PublicShell } from "@/components/PublicShell"

export default function ConfirmationLoading() {
  return (
    <PublicShell showBack backHref="/booking/ibis-style">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        {/* Success Card Skeleton */}
        <div className="rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-100 animate-pulse">
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100" />
            <div className="h-8 bg-slate-200 rounded-lg w-48 mx-auto" />
            <div className="h-4 bg-slate-100 rounded w-64 mx-auto" />
          </div>
        </div>

        {/* Booking Code Skeleton */}
        <Card className="border border-slate-100 shadow-sm animate-pulse">
          <CardContent className="pt-5">
            <div className="space-y-3">
              <div className="h-4 bg-slate-100 rounded w-24" />
              <div className="h-12 bg-slate-200 rounded-xl" />
              <div className="h-9 bg-slate-100 rounded-xl" />
            </div>
          </CardContent>
        </Card>

        {/* Status Card Skeleton */}
        <Card className="border border-slate-100 shadow-sm animate-pulse">
          <CardContent className="pt-5">
            <div className="space-y-3">
              <div className="h-4 bg-slate-100 rounded w-32" />
              <div className="h-16 bg-slate-200 rounded-xl" />
            </div>
          </CardContent>
        </Card>

        {/* Instructions Skeleton */}
        <Card className="border border-slate-100 shadow-sm animate-pulse">
          <CardContent className="space-y-3 pt-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-32" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Buttons Skeleton */}
        <div className="space-y-3">
          <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-10 bg-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>
    </PublicShell>
  )
}
