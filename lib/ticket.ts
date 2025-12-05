import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib"
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
  const page = pdfDoc.addPage([420, 640])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const primary = rgb(0.11, 0.36, 0.92)
  const muted = rgb(0.45, 0.5, 0.56)
  const surface = rgb(0.97, 0.98, 1)

  // Background accents
  page.drawRectangle({ x: 0, y: 520, width: 440, height: 150, color: primary, opacity: 0.08 })
  page.drawRectangle({ x: 16, y: 60, width: 388, height: 520, color: surface, opacity: 1, borderColor: rgb(0.88, 0.9, 0.94), borderWidth: 1 })
  page.drawRectangle({ x: -60, y: 540, width: 200, height: 120, color: primary, opacity: 0.08, rotate: degrees(-12) })

  const drawText = (text: string, x: number, y: number, size = 12, color = rgb(0, 0, 0), bold = false) => {
    page.drawText(text, { x, y, size, font: bold ? fontBold : font, color })
  }

  const drawLabelValue = (label: string, value: string | undefined, x: number, y: number, w: number) => {
    if (!value) return
    drawText(label, x, y, 9, muted, true)
    drawWrapped(value, x, y - 14, w, 12, rgb(0, 0, 0), true)
  }

  const drawWrapped = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    size = 12,
    color = rgb(0, 0, 0),
    bold = false,
  ) => {
    const fnt = bold ? fontBold : font
    const words = text.split(" ")
    let line = ""
    let dy = 0
    words.forEach((word, idx) => {
      const test = line ? `${line} ${word}` : word
      const width = fnt.widthOfTextAtSize(test, size)
      if (width > maxWidth && line) {
        page.drawText(line, { x, y: y - dy, size, font: fnt, color })
        line = word
        dy += size + 2
      } else {
        line = test
      }
      if (idx === words.length - 1 && line) {
        page.drawText(line, { x, y: y - dy, size, font: fnt, color })
      }
    })
  }

  // Header
  drawText("Shuttle Ticket", 28, 560, 20, rgb(0, 0, 0), true)
  drawText("Booking details and boarding pass", 28, 540, 11, muted)
  drawText(payload.bookingCode, 300, 558, 16, primary, true)
  drawText("Booking code", 300, 542, 9, muted, true)

  // Trip info card
  drawText("Trip information", 36, 504, 12, muted, true)
  drawLabelValue("Hotel", payload.hotelName, 36, 480, 170)
  drawLabelValue("Destination", payload.destination, 220, 480, 170)
  drawLabelValue("Date", payload.scheduleDate, 36, 444, 170)
  drawLabelValue("Departure", payload.departureTime ? `${payload.departureTime} WIB` : undefined, 220, 444, 170)
  drawLabelValue("Passengers", payload.passengerCount ? String(payload.passengerCount) : undefined, 36, 408, 170)
  drawLabelValue("Room", payload.roomNumber || undefined, 220, 408, 170)

  // Divider
  page.drawLine({ start: { x: 28, y: 376 }, end: { x: 392, y: 376 }, color: rgb(0.88, 0.9, 0.94), thickness: 1 })

  // Passenger
  drawLabelValue("Passenger", payload.customerName, 36, 360, 320)

  // QR and tracking
  const qrDataUrl = await QRCode.toDataURL(payload.trackUrl, { width: 240, margin: 0 })
  const base64 = qrDataUrl.split(",")[1]
  const qrImage = await pdfDoc.embedPng(Buffer.from(base64, "base64"))
  const qrDims = qrImage.scale(0.55)
  page.drawImage(qrImage, {
    x: 36,
    y: 180,
    width: qrDims.width,
    height: qrDims.height,
  })
  drawText("Scan to track ticket", 200, 260, 11, muted)
  drawWrapped(payload.trackUrl, 200, 238, 180, 9, primary, false)

  // Notes
  drawText("Notes", 36, 150, 11, muted, true)
  drawText("• Please arrive 15 minutes before departure.", 36, 134, 9, muted)
  drawText("• Keep this ticket and your booking code handy.", 36, 120, 9, muted)
  drawText("• For changes/cancellations, contact the hotel front desk.", 36, 106, 9, muted)

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}
