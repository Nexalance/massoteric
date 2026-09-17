import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-mock'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

// Per-user auth state — must NEVER be cached. Without this, browsers/CDNs
// can serve a stale 401 (or another user's response) to the navbar.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    // Check if user is admin via env var (single source of truth)
    const userIsAdmin = isAdmin(clerkId)

    // DEBUG: Log admin check
    console.log('🔍 Admin check:', {
      clerkId,
      adminEnvVar: process.env.ADMIN_USER_IDS,
      userIsAdmin,
    })

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
    return NextResponse.json(
      {
        ...user,
        isAdmin: userIsAdmin,
        subscriptionTier: userIsAdmin ? 'PRO' : user.subscriptionTier,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Error fetching current user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
