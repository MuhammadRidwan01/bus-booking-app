/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep image optimization disabled for now; add remote patterns when ready to enable it in prod.
  images: {
    unoptimized: true,
  },
}

export default nextConfig
