import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib"
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

/**
 * Sanitizes text to ensure compatibility with WinAnsi encoding used by standard PDF fonts.
 * Replaces unsupported special characters with safe alternatives.
 * 
 * @param text - The text to sanitize
 * @param font - The PDF font to test character encoding against
 * @returns Sanitized text that can be safely rendered in the PDF
 */
function sanitizeText(text: string, font: PDFFont): string {
  return text.split('').map(char => {
    try {
      // Test if the character can be encoded by the font
      font.encodeText(char)
      return char
    } catch {
      // Replace known problematic characters
      if (char === '→') return '-'
      if (char === '•') return '*'
      if (char === '–' || char === '—') return '-'
      if (char === '"' || char === '"') return '"'
      if (char === '\u2018' || char === '\u2019') return "'"  // Left/right single quotes
      if (char === '…') return '...'
      
      // For other characters, check if it's a letter/number or replace with space
      return char.match(/[\p{L}\p{N}]/u) ? '?' : ' '
    }
  }).join('')
}

export async function generateTicketPdf(payload: TicketPayload): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([420, 640])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Primary Colors (matching landing page)
  const blue600 = rgb(0.145, 0.408, 0.918)      // #2563EB - Primary blue
  const indigo500 = rgb(0.388, 0.376, 0.957)    // #6366F1 - Indigo accent
  const emerald500 = rgb(0.063, 0.725, 0.557)   // #10B981 - Emerald accent
  const sky500 = rgb(0.055, 0.678, 0.957)       // #0EA5E9 - Sky blue
  
  // Slate Scale (text & backgrounds)
  const slate900 = rgb(0.059, 0.078, 0.114)     // #0F172A - Darkest text
  const slate700 = rgb(0.2, 0.247, 0.333)       // #334155 - Dark text
  const slate600 = rgb(0.282, 0.333, 0.42)      // #475569 - Medium text
  const slate500 = rgb(0.392, 0.455, 0.557)     // #64748B - Light text
  const slate400 = rgb(0.58, 0.639, 0.722)      // #94A3B8 - Lighter text
  const slate300 = rgb(0.796, 0.835, 0.886)     // #CBD5E1 - Borders
  const slate50 = rgb(0.976, 0.984, 0.992)      // #F8FAFC - Lightest backgrounds
  
  // Functional Colors
  const white = rgb(1, 1, 1)                    // #FFFFFF
  
  // Accent Colors
  const warningAmber = rgb(1, 0.973, 0.882)     // #FFF8E1 - Warning background
  const warningAmberBorder = rgb(0.976, 0.843, 0.467) // #F9D777 - Warning border
  const warningAmberText = rgb(0.451, 0.333, 0.027)   // #735508 - Warning text

  const drawText = (text: string, x: number, y: number, size = 12, color = rgb(0, 0, 0), bold = false) => {
    const selectedFont = bold ? fontBold : font
    const sanitized = sanitizeText(text, selectedFont)
    page.drawText(sanitized, { x, y, size, font: selectedFont, color })
  }

  const drawWrapped = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    size = 12,
    color = rgb(0, 0, 0),
    bold = false,
    lineHeight = 2,
  ) => {
    const fnt = bold ? fontBold : font
    const sanitized = sanitizeText(text, fnt)
    const words = sanitized.split(" ")
    let line = ""
    let dy = 0
    words.forEach((word, idx) => {
      const test = line ? `${line} ${word}` : word
      const width = fnt.widthOfTextAtSize(test, size)
      if (width > maxWidth && line) {
        page.drawText(line, { x, y: y - dy, size, font: fnt, color })
        line = word
        dy += size + lineHeight
      } else {
        line = test
      }
      if (idx === words.length - 1 && line) {
        page.drawText(line, { x, y: y - dy, size, font: fnt, color })
      }
    })
  }

  // Helper function to draw rounded rectangle (simulated with multiple rectangles)
  const drawRoundedRect = (
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    color: any,
    borderColor?: any,
    borderWidth = 0,
  ) => {
    // Main rectangle
    page.drawRectangle({ x, y, width, height, color, borderColor, borderWidth })
  }

  // Subtle, refined shadow - professional restraint
  const drawSubtleShadow = (x: number, y: number, width: number, height: number) => {
    const shadowColor = rgb(0, 0, 0)
    
    // Single elegant shadow layer
    page.drawRectangle({
      x: x + 1,
      y: y - 1,
      width,
      height,
      color: shadowColor,
      opacity: 0.06,
    })
  }

  // Background - clean white page
  page.drawRectangle({ x: 0, y: 0, width: 420, height: 640, color: white })

  // REFINED HEADER - Clean gradient with subtle geometric accent
  // Clean gradient base
  page.drawRectangle({
    x: 0,
    y: 480,
    width: 420,
    height: 160,
    color: blue600,
  })
  // Subtle gradient overlay for depth
  page.drawRectangle({
    x: 0,
    y: 480,
    width: 420,
    height: 160,
    color: indigo500,
    opacity: 0.25,
  })
  
  // NIRMANA TITIK - BOLD dot pattern composition throughout header
  // Large constellation pattern - top right
  const headerDotsLarge = [
    { x: 340, y: 625, size: 5, opacity: 0.2 },
    { x: 355, y: 620, size: 3.5, opacity: 0.18 },
    { x: 370, y: 630, size: 6, opacity: 0.22 },
    { x: 360, y: 610, size: 3, opacity: 0.15 },
    { x: 385, y: 625, size: 4, opacity: 0.19 },
    { x: 375, y: 600, size: 2.5, opacity: 0.14 },
    { x: 395, y: 615, size: 3.5, opacity: 0.17 },
    { x: 350, y: 595, size: 2, opacity: 0.12 },
    { x: 390, y: 605, size: 3, opacity: 0.16 },
    { x: 365, y: 585, size: 2.5, opacity: 0.13 },
  ]
  
  // Scattered dots across header - creates texture
  const headerDotsScattered = [
    { x: 50, y: 620, size: 2, opacity: 0.1 },
    { x: 65, y: 610, size: 1.5, opacity: 0.08 },
    { x: 80, y: 625, size: 2.5, opacity: 0.11 },
    { x: 100, y: 615, size: 2, opacity: 0.09 },
    { x: 120, y: 605, size: 1.5, opacity: 0.07 },
    { x: 140, y: 620, size: 2, opacity: 0.1 },
    { x: 160, y: 610, size: 1.5, opacity: 0.08 },
    { x: 180, y: 600, size: 2, opacity: 0.09 },
    { x: 200, y: 615, size: 1.5, opacity: 0.08 },
    { x: 220, y: 605, size: 2, opacity: 0.1 },
    { x: 240, y: 620, size: 1.5, opacity: 0.07 },
    { x: 260, y: 610, size: 2, opacity: 0.09 },
    { x: 280, y: 600, size: 1.5, opacity: 0.08 },
    { x: 300, y: 615, size: 2, opacity: 0.1 },
  ]
  
  // Bottom header dots - creates flow
  const headerDotsBottom = [
    { x: 60, y: 495, size: 2, opacity: 0.09 },
    { x: 90, y: 500, size: 1.5, opacity: 0.07 },
    { x: 120, y: 490, size: 2, opacity: 0.08 },
    { x: 150, y: 505, size: 1.5, opacity: 0.07 },
    { x: 180, y: 495, size: 2, opacity: 0.09 },
    { x: 210, y: 500, size: 1.5, opacity: 0.08 },
  ]
  
  const allHeaderDots = headerDotsLarge.concat(headerDotsScattered).concat(headerDotsBottom)
  allHeaderDots.forEach(dot => {
    page.drawCircle({
      x: dot.x,
      y: dot.y,
      size: dot.size,
      color: white,
      opacity: dot.opacity,
    })
  })

  // Header content with better hierarchy
  drawText("SHUTTLE TICKET", 35, 600, 16, rgb(0.9, 0.93, 0.98))
  drawText(payload.bookingCode || "-", 35, 565, 28, white, true)
  
  // Hotel name
  drawText(payload.hotelName || "-", 35, 537, 13, white, true)
  
  // Service tagline
  drawText("Ibis Airport Shuttle Service • Free for Hotel Guests", 35, 495, 9, rgb(0.85, 0.88, 0.95))

  // ROUTE SECTION - Refined with subtle accent
  // Refined accent bar - thinner, more elegant
  page.drawRectangle({
    x: 28,
    y: 395,
    width: 4,
    height: 75,
    color: blue600,
  })
  
  // Subtle shadow
  drawSubtleShadow(35, 395, 360, 75)
  
  // Clean white card
  page.drawRectangle({
    x: 35,
    y: 395,
    width: 360,
    height: 75,
    color: white,
    borderColor: slate300,
    borderWidth: 0.5,
  })
  
  // BOLD dot pattern around route section
  const routeDots = [
    // Right side cluster
    { x: 370, y: 465, size: 2.5, opacity: 0.12 },
    { x: 378, y: 460, size: 2, opacity: 0.1 },
    { x: 385, y: 467, size: 3, opacity: 0.13 },
    { x: 375, y: 455, size: 1.5, opacity: 0.09 },
    { x: 382, y: 470, size: 2, opacity: 0.11 },
    // Left side dots
    { x: 45, y: 465, size: 2, opacity: 0.1 },
    { x: 52, y: 460, size: 1.5, opacity: 0.08 },
    { x: 48, y: 470, size: 2.5, opacity: 0.11 },
    // Top scattered
    { x: 100, y: 468, size: 1.5, opacity: 0.07 },
    { x: 150, y: 465, size: 2, opacity: 0.09 },
    { x: 200, y: 462, size: 1.5, opacity: 0.08 },
    { x: 250, y: 467, size: 2, opacity: 0.09 },
    { x: 300, y: 464, size: 1.5, opacity: 0.08 },
  ]
  
  routeDots.forEach(dot => {
    page.drawCircle({
      x: dot.x,
      y: dot.y,
      size: dot.size,
      color: blue600,
      opacity: dot.opacity,
    })
  })

  // FROM section
  drawText("FROM", 50, 455, 9, slate500, true)
  drawWrapped(payload.hotelName || "-", 50, 437, 135, 12, slate900, true, 3)

  // Bold arrow divider
  page.drawRectangle({
    x: 195,
    y: 432,
    width: 30,
    height: 2,
    color: blue600,
  })
  // Arrow head
  page.drawRectangle({
    x: 222,
    y: 430,
    width: 6,
    height: 6,
    color: blue600,
  })

  // TO section
  drawText("TO", 238, 455, 9, slate500, true)
  drawWrapped(payload.destination || "-", 238, 437, 145, 12, slate900, true, 3)

  // Date and time in colored boxes
  page.drawRectangle({
    x: 50,
    y: 405,
    width: 135,
    height: 20,
    color: slate50,
  })
  drawText(payload.scheduleDate || "-", 55, 410, 9, slate900)
  
  page.drawRectangle({
    x: 238,
    y: 405,
    width: 145,
    height: 15,
    color: rgb(0.145, 0.408, 0.918),
    opacity: 0.1,
  })
  drawText(payload.departureTime ? `${payload.departureTime} WIB` : "-", 243, 410, 9, slate900, true)

  // TRIP DETAILS - Modern card grid with colored accents
  const cardWidth = 170
  const cardHeight = 60
  const cardSpacing = 20
  const gridStartX = 30
  const gridStartY = 320

  const cardData = [
    { label: "DATE", value: payload.scheduleDate || "-", accent: blue600 },
    { label: "TIME", value: payload.departureTime ? `${payload.departureTime} WIB` : "-", accent: indigo500 },
    { label: "PASSENGERS", value: payload.passengerCount ? `${payload.passengerCount} Person(s)` : "-", accent: emerald500 },
    { label: "ROOM", value: payload.roomNumber || "-", accent: sky500 },
  ]
  
  // EXTENSIVE dot pattern around cards - creates strong visual flow
  const cardAreaDots = [
    // Left vertical line
    { x: 22, y: 360, size: 2.5, opacity: 0.12 },
    { x: 22, y: 345, size: 2, opacity: 0.1 },
    { x: 22, y: 330, size: 2.5, opacity: 0.11 },
    { x: 22, y: 315, size: 2, opacity: 0.09 },
    { x: 22, y: 300, size: 2.5, opacity: 0.12 },
    { x: 22, y: 285, size: 2, opacity: 0.1 },
    { x: 22, y: 270, size: 2.5, opacity: 0.11 },
    { x: 22, y: 255, size: 2, opacity: 0.09 },
    { x: 22, y: 240, size: 2.5, opacity: 0.12 },
    // Right vertical line
    { x: 398, y: 360, size: 2.5, opacity: 0.12 },
    { x: 398, y: 345, size: 2, opacity: 0.1 },
    { x: 398, y: 330, size: 2.5, opacity: 0.11 },
    { x: 398, y: 315, size: 2, opacity: 0.09 },
    { x: 398, y: 300, size: 2.5, opacity: 0.12 },
    { x: 398, y: 285, size: 2, opacity: 0.1 },
    { x: 398, y: 270, size: 2.5, opacity: 0.11 },
    { x: 398, y: 255, size: 2, opacity: 0.09 },
    { x: 398, y: 240, size: 2.5, opacity: 0.12 },
    // Scattered between cards
    { x: 210, y: 350, size: 2, opacity: 0.08 },
    { x: 210, y: 290, size: 2, opacity: 0.08 },
    { x: 210, y: 270, size: 1.5, opacity: 0.07 },
  ]
  
  cardAreaDots.forEach(dot => {
    page.drawCircle({
      x: dot.x,
      y: dot.y,
      size: dot.size,
      color: slate400,
      opacity: dot.opacity,
    })
  })

  cardData.forEach((card, idx) => {
    const row = Math.floor(idx / 2)
    const col = idx % 2
    const x = gridStartX + col * (cardWidth + cardSpacing)
    const y = gridStartY - row * (cardHeight + cardSpacing)
    
    // Refined accent bar - thin and elegant
    page.drawRectangle({
      x,
      y: y + cardHeight,
      width: cardWidth,
      height: 2,
      color: card.accent,
    })
    
    // Subtle shadow
    drawSubtleShadow(x, y, cardWidth, cardHeight)
    
    // Clean card background
    page.drawRectangle({
      x,
      y,
      width: cardWidth,
      height: cardHeight,
      color: white,
      borderColor: slate300,
      borderWidth: 0.5,
    })

    // Label
    drawText(card.label, x + 12, y + cardHeight - 18, 8, slate500, true)
    
    // Value
    drawWrapped(card.value, x + 12, y + cardHeight - 36, cardWidth - 24, 14, slate900, true)
  })

  // PASSENGER & QR SECTION - Refined with subtle accent
  // Refined accent bar - thin and elegant
  page.drawRectangle({
    x: 28,
    y: 115,
    width: 4,
    height: 95,
    color: blue600,
  })
  
  // Subtle shadow
  drawSubtleShadow(35, 115, 360, 95)
  
  // Clean white card
  page.drawRectangle({
    x: 35,
    y: 115,
    width: 360,
    height: 95,
    color: white,
    borderColor: slate300,
    borderWidth: 0.5,
  })
  
  // BOLD dot pattern around passenger & QR section
  const passengerDots = [
    // Left cluster near passenger
    { x: 45, y: 195, size: 2.5, opacity: 0.11 },
    { x: 52, y: 190, size: 2, opacity: 0.09 },
    { x: 48, y: 185, size: 1.5, opacity: 0.08 },
    { x: 55, y: 180, size: 2, opacity: 0.1 },
    { x: 45, y: 175, size: 1.5, opacity: 0.08 },
    { x: 50, y: 170, size: 2.5, opacity: 0.11 },
    { x: 45, y: 160, size: 2, opacity: 0.09 },
    { x: 52, y: 155, size: 1.5, opacity: 0.08 },
    { x: 48, y: 145, size: 2, opacity: 0.1 },
    { x: 45, y: 135, size: 1.5, opacity: 0.08 },
    // Scattered across section
    { x: 100, y: 190, size: 1.5, opacity: 0.07 },
    { x: 150, y: 185, size: 2, opacity: 0.08 },
    { x: 200, y: 180, size: 1.5, opacity: 0.07 },
    { x: 250, y: 190, size: 2, opacity: 0.08 },
    // Right side near QR
    { x: 380, y: 195, size: 2, opacity: 0.09 },
    { x: 385, y: 185, size: 1.5, opacity: 0.08 },
    { x: 380, y: 175, size: 2.5, opacity: 0.1 },
    { x: 385, y: 165, size: 2, opacity: 0.09 },
    { x: 380, y: 155, size: 1.5, opacity: 0.08 },
  ]
  
  passengerDots.forEach(dot => {
    page.drawCircle({
      x: dot.x,
      y: dot.y,
      size: dot.size,
      color: blue600,
      opacity: dot.opacity,
    })
  })

  // Passenger section
  drawText("PASSENGER", 50, 195, 9, slate500, true)
  drawWrapped(payload.customerName || "-", 50, 173, 200, 16, slate900, true, 4)

  // QR code with refined frame
  const qrDataUrl = await QRCode.toDataURL(payload.trackUrl || "", { 
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1A1A1A',
      light: '#FFFFFF',
    }
  })
  const qrBase64 = qrDataUrl.split(",")[1]
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, "base64"))
  const qrSize = 75
  const qrDims = qrImage.scale(qrSize / qrImage.width)
  
  const qrX = 300
  const qrY = 130
  
  // Subtle shadow
  page.drawRectangle({
    x: qrX - 4,
    y: qrY - 4,
    width: qrDims.width + 8,
    height: qrDims.height + 8,
    color: rgb(0, 0, 0),
    opacity: 0.04,
  })
  
  // Refined thin border
  page.drawRectangle({
    x: qrX - 3,
    y: qrY - 3,
    width: qrDims.width + 6,
    height: qrDims.height + 6,
    color: slate300,
  })
  page.drawRectangle({
    x: qrX - 2,
    y: qrY - 2,
    width: qrDims.width + 4,
    height: qrDims.height + 4,
    color: white,
  })
  
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrDims.width,
    height: qrDims.height,
  })
  
  // Clean label
  drawText("SCAN TO TRACK", 295, 122, 7, slate600, true)

  // IMPORTANT INFO - Refined warning section
  // Subtle shadow
  drawSubtleShadow(30, 30, 360, 70)
  
  // Clean warning box
  page.drawRectangle({
    x: 30,
    y: 30,
    width: 360,
    height: 70,
    color: warningAmber,
    borderColor: warningAmberBorder,
    borderWidth: 1,
  })
  
  // BOLD dot pattern on warning section - strong emphasis
  const warningDots = [
    // Right cluster
    { x: 370, y: 95, size: 3, opacity: 0.18 },
    { x: 378, y: 90, size: 2.5, opacity: 0.16 },
    { x: 385, y: 95, size: 2, opacity: 0.14 },
    { x: 375, y: 85, size: 2.5, opacity: 0.15 },
    { x: 382, y: 80, size: 2, opacity: 0.13 },
    { x: 370, y: 75, size: 2.5, opacity: 0.16 },
    // Left side
    { x: 40, y: 95, size: 2, opacity: 0.12 },
    { x: 40, y: 85, size: 1.5, opacity: 0.1 },
    { x: 40, y: 75, size: 2, opacity: 0.11 },
    { x: 40, y: 65, size: 1.5, opacity: 0.1 },
    { x: 40, y: 55, size: 2, opacity: 0.12 },
    { x: 40, y: 45, size: 1.5, opacity: 0.1 },
    // Scattered across warning
    { x: 100, y: 85, size: 1.5, opacity: 0.09 },
    { x: 150, y: 80, size: 2, opacity: 0.1 },
    { x: 200, y: 85, size: 1.5, opacity: 0.09 },
    { x: 250, y: 80, size: 2, opacity: 0.1 },
    { x: 300, y: 85, size: 1.5, opacity: 0.09 },
  ]
  
  warningDots.forEach(dot => {
    page.drawCircle({
      x: dot.x,
      y: dot.y,
      size: dot.size,
      color: warningAmberBorder,
      opacity: dot.opacity,
    })
  })
  
  // Clean title
  drawText("IMPORTANT INFORMATION", 45, 87, 10, warningAmberText, true)
  
  // Bullet points with better spacing
  drawText("• Arrive 10 minutes before departure", 45, 70, 8, warningAmberText)
  drawText("• Bring valid identification", 45, 58, 8, warningAmberText)
  drawText("• Keep this ticket safe", 45, 46, 8, warningAmberText)
  drawText("• Show to driver upon boarding", 45, 34, 8, warningAmberText)

  // FOOTER - Minimalist with booking code emphasis
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 420,
    height: 20,
    color: slate50,
  })
  
  // Dot pattern in footer - final touch
  const footerDots = [
    { x: 25, y: 12, size: 1.5, opacity: 0.08 },
    { x: 25, y: 8, size: 1, opacity: 0.06 },
    { x: 395, y: 12, size: 1.5, opacity: 0.08 },
    { x: 395, y: 8, size: 1, opacity: 0.06 },
  ]
  
  footerDots.forEach(dot => {
    page.drawCircle({
      x: dot.x,
      y: dot.y,
      size: dot.size,
      color: slate400,
      opacity: dot.opacity,
    })
  })
  
  drawText("Ibis Airport Shuttle", 35, 10, 8, slate500, true)
  drawText("•", 125, 10, 8, slate400)
  drawText("Free for Hotel Guests", 135, 10, 8, slate500)
  
  // Booking code in colored box
  page.drawRectangle({
    x: 270,
    y: 5,
    width: 120,
    height: 12,
    color: blue600,
    opacity: 0.1,
  })
  drawText(`Booking: ${payload.bookingCode || "-"}`, 275, 9, 7, blue600, true)

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}
