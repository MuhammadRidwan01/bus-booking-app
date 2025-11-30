import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import QRCode from "qrcode"

interface TicketPayload {
  bookingCode: string
  customerName: string
  hotelName?: string
  scheduleDate?: string
  departureTime?: string
  destination?: string
  passengerCount?: number
  roomNumber?: string | null
  trackUrl: string
}

export async function generateTicketPdf(payload: TicketPayload): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([420, 600])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const drawText = (text: string, x: number, y: number, size = 12) => {
    page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) })
  }

  drawText("Shuttle Ticket", 40, 560, 20)
  drawText(`Kode: ${payload.bookingCode}`, 40, 530, 14)
  if (payload.hotelName) drawText(`Hotel: ${payload.hotelName}`, 40, 510)
  if (payload.destination) drawText(`Tujuan: ${payload.destination}`, 40, 490)
  if (payload.scheduleDate) drawText(`Tanggal: ${payload.scheduleDate}`, 40, 470)
  if (payload.departureTime) drawText(`Jam: ${payload.departureTime} WIB`, 40, 450)
  drawText(`Nama: ${payload.customerName}`, 40, 430)
  if (payload.passengerCount) drawText(`Penumpang: ${payload.passengerCount}`, 40, 410)
  if (payload.roomNumber) drawText(`Room: ${payload.roomNumber}`, 40, 390)
  drawText(`Lacak: ${payload.trackUrl}`, 40, 360, 10)

  // QR Code
  const qrDataUrl = await QRCode.toDataURL(payload.trackUrl, { width: 200 })
  const base64 = qrDataUrl.split(",")[1]
  const qrImage = await pdfDoc.embedPng(Buffer.from(base64, "base64"))
  const qrDims = qrImage.scale(0.6)
  page.drawImage(qrImage, {
    x: 40,
    y: 200,
    width: qrDims.width,
    height: qrDims.height,
  })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}
