export const dynamic = 'force-dynamic'
// src/app/dev-access/logout/route.ts
// Exits reviewer mode: deletes the msr_reviewer cookie and lands on the feed.
// The MagicLink row itself is untouched — the link keeps working until it is
// revoked from the admin panel or expires.

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/feed', req.url))
  res.cookies.set('msr_reviewer', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  })
  return res
}
