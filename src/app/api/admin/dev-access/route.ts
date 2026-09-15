export const dynamic = 'force-dynamic'
// src/app/api/admin/dev-access/route.ts
// Admin management for time-limited reviewer access links.
// GET    — current link status (never returns the raw token)
// POST   — generate a new link (revokes any previous one; one active at a time)
// DELETE — revoke the active link immediately

import { randomBytes } from 'crypto'
import { createHash } from 'crypto'
import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function requireAdminId(): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) return null
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  return adminIds.includes(userId) ? userId : null
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export async function GET() {
  const adminId = await requireAdminId()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const link = await prisma.magicLink.findFirst({
    where: { revokedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  if (!link) return NextResponse.json({ link: null })
  return NextResponse.json({
    link: {
      id: link.id,
      label: link.label,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      expired: link.expiresAt <= new Date(),
    },
  })
}

export async function POST(req: NextRequest) {
  const adminId = await requireAdminId()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const days = Math.min(365, Math.max(1, Number(body?.expiresInDays) || 7))
  const label = typeof body?.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 100) : 'Reviewer access'

  // One active link at a time — generating revokes any previous one
  await prisma.magicLink.updateMany({
    where: { revokedAt: null },
    data: { revokedAt: new Date() },
  })

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  const created = await prisma.magicLink.create({
    data: { tokenHash: sha256(token), label, expiresAt, createdById: adminId },
  })

  return NextResponse.json({
    link: {
      id: created.id,
      label: created.label,
      createdAt: created.createdAt,
      expiresAt: created.expiresAt,
      expired: false,
    },
    // Shown once — the raw token is never stored or returned again.
    // Path only: the client builds the absolute URL from its own origin
    // (request-derived origins break behind proxies and on multi-stack hosts).
    path: `/dev-access?token=${token}`,
  })
}

export async function DELETE() {
  const adminId = await requireAdminId()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const result = await prisma.magicLink.updateMany({
    where: { revokedAt: null },
    data: { revokedAt: new Date() },
  })
  return NextResponse.json({ revoked: result.count })
}
