/**
 * Authentication middleware for protecting routes
 * Checks for valid JWT token and redirects to login if not authenticated
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/'];

// Routes that require authentication
const PROTECTED_ROUTES = ['/accounts', '/dashboard', '/pay-transfer', '/admin', '/profile', '/voice-agent'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from localStorage (client-side only) or cookies
  const token = request.cookies.get('access_token')?.value;

  // Check if current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route);

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If accessing login/signup with token, redirect to accounts
  if ((pathname === '/login' || pathname === '/signup') && token) {
    return NextResponse.redirect(new URL('/accounts', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
