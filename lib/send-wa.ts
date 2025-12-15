
// lib/send-wa.ts
export async function sendWhatsappTemplate(
  phone: string,
  customerName: string,
  bookingCode: string,
  hotelName: string,
  date: string,
  time: string,
  seats: number
) {
  try {
    const token = process.env.FONNTE_TOKEN

    if (!token) {
      console.error('FONNTE_TOKEN is not set')
      return { success: false, error: 'Configuration error' }
    }

    const message = `Halo ${customerName}, booking shuttle kamu berhasil.
  Hotel: ${hotelName}
Tanggal: ${date}
Jam: ${time} WIB
Kursi: ${seats} penumpang
Kode Booking: ${bookingCode}

Harap simpan kode ini untuk naik shuttle.Terima kasih.`

    const formData = new FormData()
    formData.append('target', phone)
    formData.append('message', message)
    formData.append('countryCode', '62')

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
      },
      body: formData,
    })

    const data = await response.json()
    return { success: response.ok && !!data.status, data }
  } catch (error) {
    return { success: false, error }
  }
}
