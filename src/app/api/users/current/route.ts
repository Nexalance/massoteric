import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-mock'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is admin via env var (single source of truth)
    const userIsAdmin = isAdmin(clerkId)

    // auth() already syncs/creates the user, so we can just fetch
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        username: true,
        displayName: true,
        subscriptionTier: true,
        isAdmin: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // For admin users, always return isAdmin: true and PRO tier
    return NextResponse.json({
      ...user,
      isAdmin: userIsAdmin,
      subscriptionTier: userIsAdmin ? 'PRO' : user.subscriptionTier,
    })
  } catch (error) {
    console.error('Error fetching current user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
