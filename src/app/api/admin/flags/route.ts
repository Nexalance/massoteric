// src/app/api/admin/flags/route.ts
// Admin: manage feature flags
// GET  — list all flags
// PATCH — toggle a flag

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FeatureKey } from '@prisma/client'
import { z } from 'zod'

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) {
    throw new Error('Forbidden')
  }
  return prisma.user.findUnique({ where: { clerkId } })
}

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await requireAdmin(clerkId)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const flags = await prisma.featureFlag.findMany({ orderBy: { key: 'asc' } })
  return NextResponse.json({ flags })
}

const PatchSchema = z.object({
  key: z.nativeEnum(FeatureKey),
  isFree: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
})

export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let admin
  try {
    admin = await requireAdmin(clerkId)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { key, isFree, isEnabled } = parsed.data

  const updated = await prisma.featureFlag.update({
    where: { key },
    data: {
      ...(isFree !== undefined && { isFree }),
      ...(isEnabled !== undefined && { isEnabled }),
      updatedBy: admin?.id,
    },
  })

  return NextResponse.json({ flag: updated })
}
