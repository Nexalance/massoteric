// src/lib/clear-cookies.ts
// Utility to clear stale Clerk cookies

import { NextResponse } from 'next/server'

export function clearClerkCookies(response?: NextResponse) {
  const res = response || new NextResponse()

  // Clear all Clerk-related cookies
  const clerkCookies = [
    '__session',
    '__clerk_session_jwt',
    '__clerk_abacus',
    '__clerk_api_ts',
  ]

  clerkCookies.forEach(cookie => {
    res.cookies.delete(cookie, { path: '/' })
  })

  return res
}
