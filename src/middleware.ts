// src/middleware.ts
// Clerk middleware — sets up auth context

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes (no auth required)
const isPublicRoute = createRouteMatcher([
  '/(.*)',  // ALL routes are public - auth handled at page level
])

export default clerkMiddleware((auth, request) => {
  // No route protection - all routes are public
  // Individual pages handle their own auth requirements
})

export const config = {
  matcher: ['/((?!_next|clerk|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
