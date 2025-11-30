"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { runCleanupExpiredSchedules, runDailyMaintenance, runGenerateSchedules } from "@/app/admin/actions"

export default function AdminToolsPage() {
  const [confirmText, setConfirmText] = useState("")
  const [log, setLog] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  const ensureConfirm = () => confirmText.trim().toUpperCase() === "SAYA YAKIN"

  const handleRun = (fn: () => Promise<any>, label: string) => {
    startTransition(async () => {
      const res = await fn()
      if (res.ok) {
        toast.success(`${label} berhasil`)
        setLog(JSON.stringify(res.data ?? res, null, 2))
      } else {
        toast.error(res.error ?? `${label} gagal`)
        setLog(JSON.stringify(res, null, 2))
      }
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Konfirmasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Ketik: SAYA YAKIN</Label>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="SAYA YAKIN" />
          <p className="text-xs text-gray-500">Diperlukan sebelum menjalankan operasi yang menyentuh banyak data.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Daily Maintenance</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Button disabled={!ensureConfirm() || isPending} onClick={() => handleRun(runDailyMaintenance, "Daily maintenance")}>Run now</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cleanup expired schedules</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Button disabled={!ensureConfirm() || isPending} onClick={() => handleRun(runCleanupExpiredSchedules, "Cleanup expired")}>Cleanup</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Regenerate upcoming schedules</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Button disabled={!ensureConfirm() || isPending} onClick={() => handleRun(() => runGenerateSchedules(7), "Generate schedules (7d)")}>Generate 7 hari</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Log</CardTitle></CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-xs bg-slate-50 p-3 rounded-md border">{log || "Belum ada log"}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
