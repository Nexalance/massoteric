// src/middleware.ts
// Clerk middleware — sets up auth context

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes (no auth required)
const isPublicRoute = createRouteMatcher([
  '/(.*)',  // ALL routes are public - auth handled at page level
])

export default clerkMiddleware((auth, request) => {
  try {
    // No route protection - all routes are public
    // Individual pages handle their own auth requirements
  } catch (error) {
    // Handle Clerk authentication errors gracefully
    console.error('Clerk auth error in middleware:', error)

    // Clear problematic cookies and redirect to sign-in
    const response = NextResponse.redirect(new URL('/sign-in', request.url))
    response.cookies.delete('__session')
    response.cookies.delete('__clerk_session_jwt')
    return response
  }
})

export const config = {
  matcher: ['/((?!_next|clerk|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
