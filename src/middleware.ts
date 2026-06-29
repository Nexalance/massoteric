// src/middleware.ts
// Clerk middleware — protects authenticated routes

// DEVELOPMENT MODE: Skip Clerk middleware if no valid keys
const DEV_MODE = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder')

// Only import Clerk if not in dev mode without keys
let clerkMiddleware: any, createRouteMatcher: any

if (!DEV_MODE) {
  const clerk = require('@clerk/nextjs/server')
  clerkMiddleware = clerk.clerkMiddleware
  createRouteMatcher = clerk.createRouteMatcher
}

const isPublicRoute = createRouteMatcher ? createRouteMatcher([
  '/',                    // landing page
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/waitlist',        // email collection
  '/api/webhooks/(.*)',   // Stripe + Clerk webhooks
]) : null

export default function middleware(request: any) {
  // In dev mode without Clerk, just pass through
  if (DEV_MODE || !clerkMiddleware) {
    return
  }

  return clerkMiddleware((auth: any, req: any) => {
    if (!isPublicRoute || !isPublicRoute(req)) auth().protect()
  })(request)
}

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
