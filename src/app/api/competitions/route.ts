// src/app/api/competitions/route.ts
// Fantasy League competitions API

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-mock'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCompetitionSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  isPublic: z.boolean().default(true),
  entryCode: z.string().optional(),
  prizeDescription: z.string().max(1000).optional(),
  prizeImageUrl: z.string().url().optional(),
  maxParticipants: z.number().int().positive().optional(),
})

// GET - List competitions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clerkUserId = searchParams.get('userId')
    const includeJoined = searchParams.get('joined') === 'true'

    let dbUserId: string | null = null
    if (clerkUserId && includeJoined) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true }
      })
      dbUserId = dbUser?.id || null
    }

    const competitions = await prisma.competition.findMany({
      where: {
        isPublic: true,
        ...(includeJoined && dbUserId
          ? {
              OR: [
                { createdBy: dbUserId },
                { members: { some: { userId: dbUserId } } },
              ],
            }
          : {}),
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate time-based status for each competition
    const now = new Date()
    const competitionsWithStatus = competitions.map((comp) => {
      const startDate = new Date(comp.startsAt)
      const endDate = new Date(comp.endsAt)

      let status: 'upcoming' | 'active' | 'ended' = 'upcoming'
      if (now > endDate) status = 'ended'
      else if (now >= startDate) status = 'active'

      return {
        ...comp,
        status,
        participantCount: comp._count.members,
      }
    })

    return NextResponse.json(competitionsWithStatus)
  } catch (error) {
    console.error('List competitions error:', error)
    return NextResponse.json(
      { error: 'Failed to list competitions' },
      { status: 500 }
    )
  }
}

// POST - Create competition
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const validated = createCompetitionSchema.parse(body)

    // Validate dates
    const startsAt = new Date(validated.startsAt)
    const endsAt = new Date(validated.endsAt)
    const now = new Date()

    if (startsAt < now) {
      return NextResponse.json(
        { error: 'Start date must be in the future' },
        { status: 400 }
      )
    }

    if (endsAt <= startsAt) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // If private, require entry code
    if (!validated.isPublic && !validated.entryCode) {
      return NextResponse.json(
        { error: 'Private competitions require an entry code' },
        { status: 400 }
      )
    }

    const competition = await prisma.competition.create({
      data: {
        name: validated.name,
        description: validated.description,
        startsAt,
        endsAt,
        isPublic: validated.isPublic,
        entryCode: validated.entryCode,
        prizeDescription: validated.prizeDescription,
        prizeImageUrl: validated.prizeImageUrl,
        maxParticipants: validated.maxParticipants,
        createdBy: dbUser.id,
        participantCount: 1, // Creator counts as first participant
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    })

    // Add creator as first member
    await prisma.competitionMember.create({
      data: {
        competitionId: competition.id,
        userId: dbUser.id,
      },
    })

    return NextResponse.json({
      success: true,
      competition: {
        ...competition,
        status: 'upcoming' as const,
        participantCount: 1,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create competition error:', error)
    return NextResponse.json(
      { error: 'Failed to create competition' },
      { status: 500 }
    )
  }
}
