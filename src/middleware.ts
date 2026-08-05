// src/middleware.ts
// Clerk middleware — DISABLED TEMPORARILY to fix auth errors
// Individual pages handle their own auth requirements

export default function middleware(request: any) {
  // Pass through all requests without Clerk middleware
  // Auth is handled at page level
  return
}

export const config = {
  matcher: ['/((?!_next|clerk|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
