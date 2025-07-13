import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { JWTService } from './lib/jwt'

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/tasks',
  '/departments',
  '/users',
  '/admin',
  '/profile',
  '/settings'
]

const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  )

  // If accessing a protected route without a token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If accessing a public route with a valid token, redirect to dashboard
  if (isPublicRoute && token) {
    try {
      JWTService.verifyToken(token)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (error) {
      // Token is invalid, continue to public route
      const response = NextResponse.next()
      response.cookies.delete('auth-token')
      return response
    }
  }

  // For API routes, add user context if token exists
  if (pathname.startsWith('/api') && token) {
    try {
      const payload = JWTService.verifyToken(token)
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', payload.userId)
      requestHeaders.set('x-user-email', payload.email)
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      // Invalid token for API routes - return 401 for protected API routes
      if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth/login')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }
  }

  // For API routes without token, check if they need authentication
  if (pathname.startsWith('/api') && !token && !pathname.startsWith('/api/auth/login')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
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
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}