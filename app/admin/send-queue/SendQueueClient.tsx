"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Copy, Filter, Loader2, MessageCircle, RefreshCcw, RotateCcw } from "lucide-react"
import { fetchSendQueueAction, resendWhatsapp } from "@/app/admin/actions"

type QueueItem = {
  id: string
  booking_code: string
  customer_name: string
  phone: string
  schedule_date: string
  departure_time: string
  destination: string
  whatsapp_sent: boolean
  whatsapp_attempts?: number | null
  whatsapp_last_error?: string | null
  created_at: string
}

export default function SendQueueClient({ initialQueue }: { initialQueue: any[] }) {
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue as QueueItem[])
  const [loading, startTransition] = useTransition()
  const [filter, setFilter] = useState<"all" | "pending" | "failed">("all")
  const [search, setSearch] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(true)

  const filtered = useMemo(() => {
    return queue.filter((item) => {
      if (filter === "pending" && (item.whatsapp_attempts ?? 0) > 0) return false
      if (filter === "failed" && (item.whatsapp_attempts ?? 0) === 0) return false
      if (!search) return true
      return (
        item.booking_code.toLowerCase().includes(search.toLowerCase()) ||
        item.phone.toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [filter, queue, search])

  const handleRetry = (id: string) => {
    startTransition(async () => {
      const res = await resendWhatsapp(id)
      if (res.ok) {
        toast.success("WhatsApp resent")
      } else {
        toast.error(res.error ?? "Failed to resend")
      }
      // simple refresh: remove from queue if now sent; we re-fetch? fallback to manual reload
    })
  }

  const refresh = useCallback(
    (mode?: "all" | "pending" | "failed") => {
      startTransition(async () => {
        try {
          const data = await fetchSendQueueAction({ mode: mode ?? filter })
          setQueue(data as QueueItem[])
        } catch (err: any) {
          toast.error(err?.message ?? "Failed to refresh queue")
        }
      })
    },
    [filter],
  )

  const handleBulkRetry = () => {
    const ids = filtered.map((item) => item.id)
    if (!ids.length) {
      toast.info("No items to retry in this view.")
      return
    }
    startTransition(async () => {
      let success = 0
      for (const id of ids) {
        const res = await resendWhatsapp(id)
        if (res.ok) success += 1
      }
      toast.success(`Retry requested for ${ids.length} item(s). Success: ${success}`)
      await refresh()
    })
  }

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      refresh()
    }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, refresh])

  return (
    <div className="space-y-4">
      <Card className="border-none bg-gradient-to-b from-background to-muted/40 shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Filter className="h-4 w-4 text-primary" />
            </span>
            <div>
              <CardTitle className="text-base font-semibold">Send queue</CardTitle>
              <p className="text-xs text-muted-foreground">Pending and failed WhatsApp sends.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => {
                setFilter("all")
                refresh("all")
              }}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === "pending" ? "default" : "outline"}
              onClick={() => {
                setFilter("pending")
                refresh("pending")
              }}
            >
              Pending
            </Button>
            <Button
              size="sm"
              variant={filter === "failed" ? "default" : "outline"}
              onClick={() => {
                setFilter("failed")
                refresh("failed")
              }}
            >
              Failed
            </Button>
            <div className="relative">
              <Input
                placeholder="Search code / phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <Button
              size="sm"
              variant={autoRefresh ? "secondary" : "outline"}
              onClick={() => setAutoRefresh((v) => !v)}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              {autoRefresh ? "Auto-refresh on" : "Auto-refresh off"}
            </Button>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </CardHeader>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Queue items</CardTitle>
            <p className="text-xs text-muted-foreground">{filtered.length} rows</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => refresh()}>
              <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button size="sm" onClick={handleBulkRetry} disabled={loading || !filtered.length}>
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
              Retry all in view
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table className="min-w-full text-xs">
              <TableHeader className="sticky top-0 z-10 bg-muted/60">
                <TableRow>
                  <TableHead className="whitespace-nowrap">Code</TableHead>
                  <TableHead className="whitespace-nowrap">Created</TableHead>
                  <TableHead className="whitespace-nowrap">Schedule</TableHead>
                  <TableHead className="whitespace-nowrap">Customer</TableHead>
                  <TableHead className="whitespace-nowrap">Phone</TableHead>
                  <TableHead className="whitespace-nowrap text-center">Attempts</TableHead>
                  <TableHead className="whitespace-nowrap">Last error</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                      Nothing in this view.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-[11px]">{item.booking_code}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      {format(new Date(item.created_at), "dd MMM HH:mm")}
                    </TableCell>
                    <TableCell className="text-[11px]">
                      {item.schedule_date} · {item.departure_time} · {item.destination}
                    </TableCell>
                    <TableCell className="text-[11px]">{item.customer_name}</TableCell>
                    <TableCell className="text-[11px]">{item.phone}</TableCell>
                    <TableCell className="text-center text-[11px]">
                      <Badge variant={(item.whatsapp_attempts ?? 0) > 0 ? "destructive" : "secondary"}>
                        {item.whatsapp_attempts ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      {item.whatsapp_last_error ?? "—"}
                    </TableCell>
                    <TableCell className="space-x-1 whitespace-nowrap text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigator.clipboard.writeText(item.booking_code)}
                        title="Copy code"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRetry(item.id)}
                        title="Resend WA"
                        disabled={loading}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
