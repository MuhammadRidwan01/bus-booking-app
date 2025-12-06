declare module "qrcode" {
  interface QRCodeToDataURLOptions {
    errorCorrectionLevel?: "L" | "M" | "Q" | "H"
    type?: "image/png" | "image/svg+xml"
    width?: number
    margin?: number
    scale?: number
    color?: {
      dark?: string
      light?: string
    }
  }

  export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>
  export default {
    toDataURL,
  }
}
