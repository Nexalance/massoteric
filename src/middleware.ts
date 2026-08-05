// src/middleware.ts
// Clerk middleware — protects authenticated routes

// DEVELOPMENT MODE: Skip Clerk middleware if no valid keys
const DEV_MODE = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder')

// Only import Clerk if not in dev mode without keys
let clerkMiddleware: any, createRouteMatcher: any, NextResponse: any

if (!DEV_MODE) {
  const clerk = require('@clerk/nextjs/server')
  clerkMiddleware = clerk.clerkMiddleware
  createRouteMatcher = clerk.createRouteMatcher
  NextResponse = require('next/server').NextResponse
}

const isPublicRoute = createRouteMatcher ? createRouteMatcher([
  '/',                    // landing page
  '/feed',                // public feed — browse without auth
  '/feed/(.*)',           // all feed sub-routes including categories and subcategories
  '/market(.*)',          // public market pages — browse without auth
  '/leaderboard',         // public leaderboard
  '/profile(.*)',         // public profiles — browse without auth
  '/competitions(.*)',     // public competitions — browse without auth
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/waitlist',        // email collection
  '/api/sync',            // public sync endpoint for cron jobs
  '/api/webhooks/(.*)',   // Stripe + Clerk webhooks
  '/me',                  // Allow /me, handle auth in page
  '/creator(.*)',         // Creator routes — handle auth in page, allow middleware to pass through
  '/admin(.*)',          // Admin routes — handle auth in page
]) : null

export default function middleware(request: any) {
  // In dev mode without Clerk, just pass through
  if (DEV_MODE || !clerkMiddleware) {
    return
  }

  try {
    return clerkMiddleware((auth: any, req: any) => {
      if (!isPublicRoute || !isPublicRoute(req)) auth().protect()
    })(request)
  } catch (error: any) {
    // Handle Clerk errors (key rotation, invalid tokens, etc.)
    // Redirect to sign-in with a fresh start instead of crashing
    console.log('Clerk middleware error, redirecting to sign-in:', error.message?.substring(0, 100))

    // Clear session cookies and redirect to sign-in
    const url = request.nextUrl || new URL(request.url, 'http://localhost:3000')
    const signInUrl = new URL('/sign-in', url)

    // Add Clerk's redirect URL to return after sign-in
    signInUrl.searchParams.set('redirect_url', url.pathname + url.search)

    const response = NextResponse.redirect(signInUrl)

    // Clear Clerk session cookies to force fresh login
    response.cookies.delete('__session')
    response.cookies.delete('__clerk_session_jwt')

    return response
  }
}

export const config = {
  matcher: ['/((?!_next|clerk|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
