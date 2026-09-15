export const dynamic = 'force-dynamic'
// src/app/dev-access/route.ts
// Time-limited reviewer access. A valid token from the admin panel turns this
// URL into an admin session via the msr_reviewer cookie (see auth-mock.ts).
// The raw token is never stored — only its SHA-256 hash (MagicLink table).

import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const REVIEWER_COOKIE = 'msr_reviewer'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()

  if (token) {
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const link = await prisma.magicLink.findUnique({ where: { tokenHash } })

    if (link && !link.revokedAt && link.expiresAt > new Date()) {
      // Relative Location — keeps the visitor on the host they typed
      // (absolute redirects would bounce through the server bind address).
      const res = new NextResponse(null, { status: 307, headers: { Location: '/feed' } })
      res.cookies.set(REVIEWER_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        // Cap the cookie at the link's remaining lifetime
        maxAge: Math.max(60, Math.floor((link.expiresAt.getTime() - Date.now()) / 1000)),
      })
      return res
    }
  }

  // Invalid, expired or revoked token — land on the feed with no access cookie
  const res = new NextResponse(null, { status: 307, headers: { Location: '/feed' } })
  res.cookies.delete(REVIEWER_COOKIE)
  return res
}
