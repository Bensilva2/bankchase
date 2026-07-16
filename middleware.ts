import { NextRequest, NextResponse } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/sign-in',
  '/signup',
  '/sign-up',
  '/terms-of-service',
  '/help',
  '/about',
]

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/accounts',
  '/cards',
  '/transfers',
  '/transactions',
  '/settings',
  '/profile',
  '/app',
]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if user has auth token in cookies
  const authToken = request.cookies.get('auth_token')
  const authUser = request.cookies.get('auth_user')
  const isAuthenticated = !!(authToken || authUser)

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    // Redirect authenticated users away from auth pages
    if (isAuthenticated && (pathname === '/login' || pathname === '/sign-in' || pathname === '/signup' || pathname === '/sign-up')) {
      return NextResponse.redirect(new URL('/accounts', request.url))
    }
    return NextResponse.next()
  }

  // Check protected routes
  const isProtectedRoute = protectedRoutes.some(
    route => pathname === route || pathname.startsWith(route + '/')
  )

  if (isProtectedRoute) {
    // Redirect unauthenticated users to login
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|icon-light-32x32.png|icon-dark-32x32.png|apple-icon.png).*)',
  ],
}
