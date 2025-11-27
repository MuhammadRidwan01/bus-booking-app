// lib/send-wa.ts
export async function sendWhatsappTemplate(to: string, variables: Record<string, string>) {
  try {
    const res = await fetch("https://sby.wablas.com/api/v2/send-template", {
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
