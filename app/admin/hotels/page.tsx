import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getHotels } from "../data"

export default async function HotelsPage() {
  const hotels = await getHotels()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hotels</CardTitle>
        <p className="text-sm text-gray-500">Daftar hotel yang tersedia</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hotels.length === 0 && <TableRow><TableCell colSpan={3}>Tidak ada data</TableCell></TableRow>}
            {hotels.map((h) => (
              <TableRow key={h.id}>
                <TableCell>{h.name}</TableCell>
                <TableCell className="font-mono text-xs">{h.slug}</TableCell>
                <TableCell>{h.is_active ? "Active" : "Inactive"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
