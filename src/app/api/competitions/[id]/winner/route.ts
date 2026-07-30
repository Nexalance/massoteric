// src/app/api/competitions/[id]/winner/route.ts
// Declare competition winner (creator only)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-mock'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const declareWinnerSchema = z.object({
  winnerId: z.string(),
})

// POST - Declare winner (creator only)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Look up DB user by Clerk ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: session.userId },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 401 })
    }

    const competitionId = params.id
    const body = await req.json()
    const validated = declareWinnerSchema.parse(body)

    // Get competition
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        members: {
          select: { userId: true },
        },
      },
    })

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
    }

    // Only creator can declare winner
    if (competition.createdBy !== dbUser.id) {
      return NextResponse.json(
        { error: 'Only the competition creator can declare a winner' },
        { status: 403 }
      )
    }

    // Competition must have ended
    if (new Date() < new Date(competition.endsAt)) {
      return NextResponse.json(
        { error: 'Cannot declare winner before competition ends' },
        { status: 400 }
      )
    }

    // Winner must be a competition member
    const isMember = competition.members.some(m => m.userId === validated.winnerId)
    if (!isMember) {
      return NextResponse.json(
        { error: 'Winner must be a competition participant' },
        { status: 400 }
      )
    }

    // Update competition with winner
    await prisma.competition.update({
      where: { id: competitionId },
      data: { winnerId: validated.winnerId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Declare winner error:', error)
    return NextResponse.json(
      { error: 'Failed to declare winner' },
      { status: 500 }
    )
  }
}
