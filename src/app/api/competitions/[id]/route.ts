// src/app/api/competitions/[id]/route.ts
// Competition detail, join, and leaderboard

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-mock'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const joinCompetitionSchema = z.object({
  entryCode: z.string().optional(),
})

// GET - Competition detail with leaderboard
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const competitionId = params.id
    const session = await auth()
    let currentUserId: string | null = null

    if (session?.userId) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: session.userId },
        select: { id: true }
      })
      currentUserId = dbUser?.id || null
    }

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            avgBrierScore: 'asc',
          },
        },
      },
    })

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
    }

    // Check if current user is a member
    const isMember = currentUserId
      ? competition.members.some((m) => m.userId === currentUserId)
      : false

    // Check if current user is the creator
    const isCreator = currentUserId === competition.createdBy

    // Calculate status
    const now = new Date()
    const startDate = new Date(competition.startsAt)
    const endDate = new Date(competition.endsAt)

    let status: 'upcoming' | 'active' | 'ended' = 'upcoming'
    if (now > endDate) status = 'ended'
    else if (now >= startDate) status = 'active'

    // Return leaderboard (only show Brier scores if competition has ended or user is member)
    const showScores = status === 'ended' || isMember

    const leaderboard = competition.members.map((member, index) => ({
      rank: index + 1,
      userId: member.userId,
      username: member.user.username,
      displayName: member.user.displayName,
      avatarUrl: member.user.avatarUrl,
      totalPredictions: showScores ? member.totalPredictions : undefined,
      scoredPredictions: showScores ? member.scoredPredictions : undefined,
      avgBrierScore: showScores ? member.avgBrierScore : undefined,
      joinedAt: member.joinedAt,
    }))

    return NextResponse.json({
      id: competition.id,
      name: competition.name,
      description: competition.description,
      startsAt: competition.startsAt,
      endsAt: competition.endsAt,
      status,
      isPublic: competition.isPublic,
      prizeDescription: competition.prizeDescription,
      prizeImageUrl: competition.prizeImageUrl,
      maxParticipants: competition.maxParticipants,
      participantCount: competition.members.length,
      creator: competition.creator,
      winner: competition.winner,
      isMember,
      isCreator,
      leaderboard: showScores ? leaderboard : leaderboard.map((m) => ({ ...m, avgBrierScore: undefined })),
    })
  } catch (error) {
    console.error('Get competition error:', error)
    return NextResponse.json(
      { error: 'Failed to get competition' },
      { status: 500 }
    )
  }
}

// POST - Join competition
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
    const userId = dbUser.id

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    })

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
    }

    // Check if already a member
    const existingMember = await prisma.competitionMember.findUnique({
      where: {
        competitionId_userId: {
          competitionId,
          userId,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'Already a member of this competition' },
        { status: 400 }
      )
    }

    // Check if competition is full
    if (competition.maxParticipants && competition.participantCount >= competition.maxParticipants) {
      return NextResponse.json(
        { error: 'Competition is full' },
        { status: 400 }
      )
    }

    // Check if competition has ended
    if (new Date() > new Date(competition.endsAt)) {
      return NextResponse.json(
        { error: 'Cannot join a competition that has ended' },
        { status: 400 }
      )
    }

    // For private competitions, validate entry code
    if (!competition.isPublic) {
      const body = await req.json()
      const validated = joinCompetitionSchema.parse(body)

      if (validated.entryCode !== competition.entryCode) {
        return NextResponse.json(
          { error: 'Invalid entry code' },
          { status: 403 }
        )
      }
    }

    // Add member
    await prisma.$transaction([
      prisma.competitionMember.create({
        data: {
          competitionId,
          userId,
        },
      }),
      prisma.competition.update({
        where: { id: competitionId },
        data: {
          participantCount: {
            increment: 1,
          },
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Join competition error:', error)
    return NextResponse.json(
      { error: 'Failed to join competition' },
      { status: 500 }
    )
  }
}

// DELETE - Leave competition
export async function DELETE(
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
    const userId = dbUser.id

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    })

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
    }

    // Cannot leave if you're the creator
    if (competition.createdBy === userId) {
      return NextResponse.json(
        { error: 'Creator cannot leave their own competition' },
        { status: 400 }
      )
    }

    // Check if competition has started
    if (new Date() >= new Date(competition.startsAt)) {
      return NextResponse.json(
        { error: 'Cannot leave a competition that has already started' },
        { status: 400 }
      )
    }

    // Remove member
    await prisma.$transaction([
      prisma.competitionMember.delete({
        where: {
          competitionId_userId: {
            competitionId,
            userId,
          },
        },
      }),
      prisma.competition.update({
        where: { id: competitionId },
        data: {
          participantCount: {
            decrement: 1,
          },
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Leave competition error:', error)
    return NextResponse.json(
      { error: 'Failed to leave competition' },
      { status: 500 }
    )
  }
}
