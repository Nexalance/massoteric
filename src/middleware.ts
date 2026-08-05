// src/middleware.ts
// Minimal Clerk middleware - sets up auth context without protecting routes

const DEV_MODE = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder')

let clerkMiddleware: any

if (!DEV_MODE) {
  const clerk = require('@clerk/nextjs/server')
  clerkMiddleware = clerk.clerkMiddleware
}

export default function middleware(request: any) {
  // In dev mode without Clerk, pass through
  if (DEV_MODE || !clerkMiddleware) {
    return
  }

  // Use Clerk middleware to set up auth context, but don't protect any routes
  // All route protection happens at the page level
  return clerkMiddleware(() => {
    return
  })(request)
}

export const config = {
  matcher: ['/((?!_next|clerk|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
