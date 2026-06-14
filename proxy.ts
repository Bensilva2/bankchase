import { NextRequest, NextResponse } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'

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

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl

  // Check if route requires authentication or special roles
  const routeConfig = Object.entries(routeRequirements).find(([route]) => pathname.startsWith(route))?.[1]

  if (routeConfig?.requireAuth) {
    // Get user session from cookies
    const authCookie = request.cookies.get('auth_user')?.value

    if (!authCookie) {
      // Redirect to login if no session
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }

    // Parse the session
    let user: any
    try {
      user = JSON.parse(authCookie)
    } catch (err) {
      // Invalid session, redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }

    // Check role-based access
    if (routeConfig.requiredRoles && routeConfig.requiredRoles.length > 0) {
      const userRole = user?.role

      if (!userRole || !routeConfig.requiredRoles.includes(userRole)) {
        // User doesn't have required role - redirect to dashboard
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
