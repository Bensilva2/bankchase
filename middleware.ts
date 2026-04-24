import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/accounts', '/transfer', '/transactions', '/profile']

// Admin-only routes
const adminRoutes = ['/admin']

// Route requirements
const routeRequirements: Record<string, { requireAuth: boolean; requiredRoles?: string[] }> = {
  '/admin': { requireAuth: true, requiredRoles: ['admin'] },
  '/dashboard': { requireAuth: true },
  '/accounts': { requireAuth: true },
  '/transfer': { requireAuth: true },
  '/transactions': { requireAuth: true },
  '/profile': { requireAuth: true },
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route requires authentication or special roles
  const routeConfig = Object.entries(routeRequirements).find(([route]) => pathname.startsWith(route))?.[1]

  if (routeConfig?.requireAuth) {
    // Get token from cookie or header
    const token = request.cookies.get('auth_token')?.value || getTokenFromHeader(request.headers.get('Authorization'))

    if (!token) {
      // Redirect to login if no token
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }

    // Verify token
    const payload = verifyToken(token)

    if (!payload) {
      // Redirect to login if token is invalid
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }

    // Check role-based access
    if (routeConfig.requiredRoles && routeConfig.requiredRoles.length > 0) {
      const userRole = (payload as any)?.role

      if (!userRole || !routeConfig.requiredRoles.includes(userRole)) {
        // User doesn't have required role - redirect to dashboard
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
