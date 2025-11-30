import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-url', request.url)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Persist admin key from query to cookie for smoother navigation
  const key = request.nextUrl.searchParams.get('key')
  if (key) {
    response.cookies.set('admin_key', key, { path: '/', httpOnly: false })
  }

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/booking/:path*',
    '/admin/:path*',
  ],
}
