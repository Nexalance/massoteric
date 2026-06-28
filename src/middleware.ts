// src/middleware.ts
// Clerk middleware — protects authenticated routes

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',                    // landing page
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/waitlist',        // email collection
  '/api/webhooks/(.*)',   // Stripe + Clerk webhooks
])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) auth().protect()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
