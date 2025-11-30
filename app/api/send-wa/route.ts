import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { phone, message, pdfUrl, caption } = await req.json()

    if (!phone || !message) {
      return NextResponse.json({ ok: false, error: "phone and message are required" }, { status: 400 })
    }

    const token = process.env.WABLAS_TOKEN
    const secretKey = process.env.WABLAS_SECRET_KEY
    const baseUrl = process.env.WABLAS_BASE_URL ?? "https://bdg.wablas.com"

    if (!token || !secretKey) {
      return NextResponse.json({ ok: false, error: "Wablas credentials not configured" }, { status: 500 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    // Helper to send text-only message
    const sendText = async () => {
      const body = new URLSearchParams({
        phone,
        message,
        flag: "instant",
      })

      const wablasResponse = await fetch(`${baseUrl}/api/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `${token}.${secretKey}`,
        },
        body,
        signal: controller.signal,
      })

      let data: unknown = null
      try {
        data = await wablasResponse.json()
      } catch {
        data = null
      }

      const wablasStatus = Boolean((data as any)?.status)
      const isSuccess = wablasResponse.ok && wablasStatus

      return { isSuccess, status: wablasResponse.status, data }
    }

    // Helper to send PDF as document if provided (use direct URL; caller must provide publicly reachable link)
    const sendPdf = async () => {
      if (!pdfUrl) return null
      try {
        const body = new URLSearchParams({
          phone,
          caption: caption || message,
          document: pdfUrl,
          filename: pdfUrl.split("/").pop() || "ticket.pdf",
          flag: "instant",
        })

        const resp = await fetch(`${baseUrl}/api/send-document`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `${token}.${secretKey}`,
          },
          body,
          signal: controller.signal,
        })

        let data: unknown = null
        try {
          data = await resp.json()
        } catch {
          data = null
        }
        const wablasStatus = Boolean((data as any)?.status)
        const isSuccess = resp.ok && wablasStatus
        return { isSuccess, status: resp.status, data }
      } catch (err) {
        console.error("Wablas PDF send failed", { message: (err as Error)?.message })
        return null
      }
    }

    try {
      // Try PDF first if available
      let pdfTried = false
      let pdfFailedData: unknown = null
      if (pdfUrl) {
        pdfTried = true
        const pdfResult = await sendPdf()
        if (pdfResult?.isSuccess) {
          clearTimeout(timeout)
          return NextResponse.json({ ok: true, data: pdfResult.data })
        } else if (pdfResult) {
          pdfFailedData = pdfResult.data
          console.error("Wablas send-document failed", { status: pdfResult.status, data: pdfResult.data })
        }
      }

      const textMessage = pdfUrl && pdfFailedData
        ? `${message}\nPDF: ${pdfUrl}`
        : message

      const body = new URLSearchParams({
        phone,
        message: textMessage,
        flag: "instant",
      })

      const textResultRaw = await fetch(`${baseUrl}/api/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `${token}.${secretKey}`,
        },
        body,
        signal: controller.signal,
      })

      let textData: unknown = null
      try {
        textData = await textResultRaw.json()
      } catch {
        textData = null
      }

      const textSuccess = textResultRaw.ok && Boolean((textData as any)?.status)
      clearTimeout(timeout)
      if (textSuccess) {
        // If PDF failed, include link info so caller can notify user
        return NextResponse.json({ ok: true, data: textData, pdfSent: !pdfFailedData && pdfUrl ? true : false, pdfUrl: pdfUrl ?? null })
      }

      console.error("Wablas send failed", {
        status: textResultRaw.status,
        data: textData,
      })
      return NextResponse.json(
        { ok: false, error: "Failed to send WhatsApp", data: textData },
        { status: 502 },
      )
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        return NextResponse.json(
          { ok: false, error: "Network or timeout error to Wablas" },
          { status: 504 },
        )
      }

      console.error("Wablas network error", { message: (error as Error)?.message })
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
