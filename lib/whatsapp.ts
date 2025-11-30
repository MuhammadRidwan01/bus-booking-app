interface SendParams {
  phone: string
  message: string
  pdfUrl?: string
  caption?: string
}

interface SendResult {
  ok: boolean
  data: unknown
}

export async function sendWhatsappMessage(params: SendParams): Promise<SendResult> {
  const baseUrl = process.env.APP_BASE_URL
  if (!baseUrl) {
    throw new Error("APP_BASE_URL is not configured")
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api/send-wa`
  let lastError: unknown = null

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: params.phone, message: params.message, pdfUrl: params.pdfUrl, caption: params.caption }),
      })

      const data = await response
        .json()
        .catch(() => ({ ok: false, error: "Invalid JSON response" }))

      if (response.ok && (data as any)?.ok) {
        return { ok: true, data }
      }

      const shouldRetry = response.status >= 500 || response.status === 504
      if (!shouldRetry || attempt === 2) {
        lastError = data
        break
      }

      continue
    } catch (error) {
      lastError = error
      if (attempt === 2) {
        break
      }
    }
  }

  console.error("Failed to send WhatsApp", {
    phone: params.phone,
    error: lastError instanceof Error ? lastError.message : lastError,
  })

  return { ok: false, data: lastError }
}
