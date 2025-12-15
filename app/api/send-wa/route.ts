import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { phone, message, pdfUrl, caption } = await req.json()

    if (!phone || !message) {
      return NextResponse.json({ ok: false, error: "phone and message are required" }, { status: 400 })
    }

    const token = process.env.FONNTE_TOKEN

    if (!token) {
      return NextResponse.json({ ok: false, error: "Fonnte token not configured" }, { status: 500 })
    }

    // Fonnte API endpoint
    const FONNTE_URL = "https://api.fonnte.com/send"

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    try {
      const formData = new FormData()
      formData.append("target", phone)
      formData.append("message", message)
      formData.append("countryCode", "62") // Default to Indonesia

      if (pdfUrl) {
        // Attempt to fetch the PDF server-side to handle localhost/internal URLs
        try {
          console.log("[send-wa] Fetching PDF from:", pdfUrl)
          const pdfRes = await fetch(pdfUrl)
          if (pdfRes.ok) {
            const pdfBuffer = await pdfRes.arrayBuffer()
            // Append file with filename 'ticket.pdf'
            formData.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), "ticket.pdf")
          } else {
            console.warn("[send-wa] Failed to fetch PDF, falling back to URL:", pdfRes.status)
            formData.append("url", pdfUrl)
            formData.append("filename", "ticket.pdf")
          }
        } catch (err) {
          console.error("[send-wa] Error fetching PDF:", err)
          // Fallback to URL if fetch fails completely
          formData.append("url", pdfUrl)
          formData.append("filename", "ticket.pdf")
        }
      }

      const response = await fetch(FONNTE_URL, {
        method: "POST",
        headers: {
          Authorization: token,
          // Note: When using FormData, Content-Type header should not be set manually 
          // to let the browser/runtime set the boundary.
        },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      let data: unknown = null
      try {
        data = await response.json()
      } catch {
        data = null
      }

      // Fonnte returns { status: true, ... } on success
      const isSuccess = response.ok && Boolean((data as any)?.status)

      if (isSuccess) {
        return NextResponse.json({ ok: true, data })
      } else {
        console.error("Fonnte send failed", { status: response.status, data })
        return NextResponse.json(
          { ok: false, error: "Failed to send WhatsApp via Fonnte", data },
          { status: response.status >= 500 ? 502 : 400 }
        )
      }
    } catch (error) {
      clearTimeout(timeout)
      if ((error as Error)?.name === "AbortError") {
        return NextResponse.json(
          { ok: false, error: "Network or timeout error to Fonnte" },
          { status: 504 },
        )
      }

      console.error("Fonnte network error", { message: (error as Error)?.message })
      return NextResponse.json(
        { ok: false, error: "Internal error while sending WhatsApp" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unexpected error in /api/send-wa", { message: (error as Error)?.message })
    return NextResponse.json(
      { ok: false, error: "Internal error while sending WhatsApp" },
      { status: 500 },
    )
  }
}
