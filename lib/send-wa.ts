// lib/send-wa.ts
export async function sendWhatsappTemplate(to: string, variables: Record<string, string>) {
  try {
    // Use environment variable for WhatsApp API base URL
    const baseUrl = process.env.WABLAS_BASE_URL || "https://sby.wablas.com"
    const apiUrl = `${baseUrl}/api/v2/send-template`
    
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: process.env.WABLAS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: to, // format: 628xxxxx
        template_id: process.env.WABLAS_TEMPLATE_ID, // masukkan ID template kamu
        data: variables,
      }),
    })

    const json = await res.json()
    return { success: res.ok, response: json }
  } catch (error) {
    return { success: false, error }
  }
}
