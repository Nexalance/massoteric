export const dynamic = 'force-dynamic'
// src/app/api/waitlist/route.ts
// Collects emails from the landing page — no auth required

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  email: z.string().email(),
  source: z.string().max(20).default('hero'),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  await prisma.waitlistEntry.upsert({
    where: { email: parsed.data.email },
    update: {},
    create: { email: parsed.data.email, source: parsed.data.source },
  })

  return NextResponse.json({ success: true })
}
