"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useState } from "react"

interface BookingCodeProps {
  bookingCode: string
}

export default function BookingCode({ bookingCode }: BookingCodeProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookingCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <Card className="border border-slate-100 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-900">Booking Code</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-800 text-white p-6 shadow-inner">
          <p className="text-xs uppercase tracking-[0.35em] text-white/60 mb-2">Code</p>
          <div className="text-3xl font-mono font-bold tracking-[0.2em]">{bookingCode}</div>
          <p className="text-sm text-white/70 mt-1">Keep this code for check-in and tracking</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-full bg-white text-slate-900 hover:bg-slate-100"
            onClick={copyToClipboard}
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? "Copied" : "Copy code"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
