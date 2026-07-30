// src/app/api/creator/settings/route.ts
// Update creator subscription pricing and settings

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-mock'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  monthlyPriceCents: z.number().min(100).max(99999).optional(), // $1 - $999.99
  platformFeeBps: z.number().min(0).max(10000).optional(), // 0 - 100%
})

// Helper to get DB user from session
async function getDbUserFromSession(session: any) {
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: session.userId },
    select: { id: true }
  })
  return dbUser
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getDbUserFromSession(session)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 401 })
    }

    const body = await req.json()
    const validated = updateSettingsSchema.parse(body)

    const settings = await prisma.creatorSettings.upsert({
      where: { userId: dbUser.id },
      create: {
        userId: dbUser.id,
        ...validated,
      },
      update: validated,
    })

    return NextResponse.json({
      success: true,
      settings: {
        monthlyPrice: settings.monthlyPriceCents / 100,
        platformFeePercent: settings.platformFeeBps / 100,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update creator settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update creator settings' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getDbUserFromSession(session)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 401 })
    }

    const settings = await prisma.creatorSettings.findUnique({
      where: { userId: dbUser.id },
    })

    return NextResponse.json({
      monthlyPrice: settings?.monthlyPriceCents ? settings.monthlyPriceCents / 100 : 9.99,
      platformFeePercent: settings?.platformFeeBps ? settings.platformFeeBps / 100 : 20,
    })
  } catch (error) {
    console.error('Get creator settings error:', error)
    return NextResponse.json(
      { error: 'Failed to get creator settings' },
      { status: 500 }
    )
  }
}
