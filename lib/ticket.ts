import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib"
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

  const primary = rgb(0.12, 0.35, 0.85)
  const indigo = rgb(0.16, 0.2, 0.51)
  const cyan = rgb(0.05, 0.7, 0.8)
  const slate = rgb(0.38, 0.42, 0.48)
  const border = rgb(0.87, 0.9, 0.94)
  const surface = rgb(0.98, 0.99, 1)

  const drawText = (text: string, x: number, y: number, size = 12, color = rgb(0, 0, 0), bold = false) => {
    page.drawText(text, { x, y, size, font: bold ? fontBold : font, color })
  }

  const drawLabelValue = (label: string, value: string | undefined, x: number, y: number, w: number) => {
    if (!value) return
    drawText(label, x, y, 8.5, slate, true)
    drawWrapped(value, x, y - 12, w, 12, rgb(0, 0, 0), true)
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

  // Background accents
  page.drawRectangle({ x: -60, y: 520, width: 260, height: 180, color: primary, opacity: 0.08, rotate: degrees(-12) })
  page.drawRectangle({ x: 18, y: 70, width: 384, height: 500, color: surface, borderColor: border, borderWidth: 1 })

  // Header card
  page.drawRectangle({
    x: 26,
    y: 470,
    width: 368,
    height: 120,
    color: indigo,
    opacity: 0.96,
    borderColor: primary,
    borderWidth: 1,
  })

  drawText("SHUTTLE PASS", 42, 548, 18, rgb(1, 1, 1), true)
  drawText("Premium Transportation Service", 42, 528, 10, rgb(0.85, 0.92, 1))

  drawText("BOOKING CODE", 248, 548, 8, rgb(0.85, 0.92, 1), true)
  drawText(payload.bookingCode || "-", 248, 530, 16, rgb(1, 1, 1), true)

  // Route card
  page.drawRectangle({
    x: 34,
    y: 484,
    width: 352,
    height: 66,
    color: rgb(1, 1, 1),
    opacity: 0.08,
    borderColor: rgb(1, 1, 1),
    borderWidth: 0.4,
  })
  drawText("From", 42, 524, 8.5, rgb(0.85, 0.92, 1), true)
  drawWrapped(payload.hotelName || "-", 42, 506, 130, 12, rgb(1, 1, 1), true)
  drawText("→", 200, 512, 18, rgb(1, 1, 1), true)
  drawText("To", 248, 524, 8.5, rgb(0.85, 0.92, 1), true)
  drawWrapped(payload.destination || "-", 248, 506, 130, 12, rgb(1, 1, 1), true)

  // Perforation
  page.drawLine({ start: { x: 32, y: 460 }, end: { x: 388, y: 460 }, color: border, thickness: 1, dashArray: [6, 6] })

  // Body title
  drawText("Trip Details", 42, 438, 11, slate, true)

  // Trip grid cards
  const cardY = [414, 414, 374, 374]
  const cardX = [42, 226, 42, 226]
  const labels = ["Date", "Departure", "Passengers", "Room"]
  const values = [
    payload.scheduleDate || "-",
    payload.departureTime ? `${payload.departureTime} WIB` : "-",
    payload.passengerCount ? `${payload.passengerCount} Person(s)` : "-",
    payload.roomNumber ? `#${payload.roomNumber}` : "-",
  ]

  labels.forEach((label, idx) => {
    const x = cardX[idx]
    const y = cardY[idx]
    page.drawRectangle({ x, y: y - 2, width: 152, height: 34, color: rgb(1, 1, 1), opacity: 0.9, borderColor: border, borderWidth: 1 })
    drawText(label.toUpperCase(), x + 10, y + 20, 8, slate, true)
    drawText(values[idx], x + 10, y + 6, 12, rgb(0.08, 0.12, 0.2), true)
  })

  // Passenger + QR container
  page.drawRectangle({ x: 34, y: 220, width: 352, height: 132, color: rgb(1, 1, 1), opacity: 0.95, borderColor: border, borderWidth: 1 })
  drawText("Passenger Name", 44, 336, 9, slate, true)
  drawWrapped(payload.customerName || "-", 44, 318, 200, 18, rgb(0.08, 0.12, 0.2), true)
  drawText("Scan the QR code to track your shuttle in real time.", 44, 298, 9, slate)

  const qrDataUrl = await QRCode.toDataURL(payload.trackUrl || "", { width: 240, margin: 0 })
  const qrBase64 = qrDataUrl.split(",")[1]
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, "base64"))
  const qrDims = qrImage.scale(0.35)
  page.drawRectangle({ x: 260, y: 238, width: qrDims.width + 20, height: qrDims.height + 20, color: rgb(0.06, 0.07, 0.09) })
  page.drawImage(qrImage, { x: 270, y: 248, width: qrDims.width, height: qrDims.height })
  drawText("Scan QR Code", 275, 232, 9, slate, true)

  // Notes
  page.drawRectangle({ x: 34, y: 170, width: 352, height: 44, color: rgb(1, 0.97, 0.93), borderColor: rgb(0.96, 0.73, 0.24), borderWidth: 1 })
  drawText("Important Information", 44, 202, 10, rgb(0.58, 0.31, 0.05), true)
  drawText("• Please arrive 15 minutes before departure.", 44, 188, 9, rgb(0.58, 0.31, 0.05))
  drawText("• Keep this ticket and booking code accessible.", 44, 176, 9, rgb(0.58, 0.31, 0.05))

  // Footer
  drawText("Ibis Shuttle Service • Premium Transportation", 42, 150, 10, slate)
  drawText(payload.bookingCode || "-", 320, 150, 10, slate, true)

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}
