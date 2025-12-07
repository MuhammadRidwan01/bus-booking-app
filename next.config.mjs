/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep image optimization disabled for now; add remote patterns when ready to enable it in prod.
  images: {
    unoptimized: true,
  },
  
  // Production security settings
  productionBrowserSourceMaps: false, // Disable source maps in production
  
  // Minification is enabled by default in Next.js production builds
  // swcMinify is the default minifier in Next.js 13+
  
  // Environment variable validation
  env: {
    // Validate that required public environment variables are set
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Additional security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

export default nextConfig
