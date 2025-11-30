import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getSupabaseAdmin } from "@/lib/supabase-server"

export default async function BusSchedulesPage() {
  const supabase = await getSupabaseAdmin()
  const { data } = await supabase
    .from("bus_schedules")
    .select("id, departure_time, destination, max_capacity, is_active, hotels(name)")
    .order("departure_time")

  const rows = data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bus Schedules Templates</CardTitle>
        <p className="text-sm text-gray-500">Template jadwal dasar per hotel</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hotel</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead>Tujuan</TableHead>
              <TableHead>Kapasitas</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-sm text-gray-500">Tidak ada data</TableCell></TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm">{(r as any).hotels?.name}</TableCell>
                <TableCell className="text-sm">{r.departure_time}</TableCell>
                <TableCell className="text-sm">{r.destination}</TableCell>
                <TableCell className="text-sm">{r.max_capacity}</TableCell>
                <TableCell className="text-sm">{r.is_active ? "Active" : "Inactive"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
