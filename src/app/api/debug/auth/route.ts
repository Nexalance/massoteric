import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-mock'
import { isAdmin } from '@/lib/admin'

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId, user } = await auth()

    return NextResponse.json({
      authenticated: !!clerkId,
      clerkId,
      email: user?.emailAddresses?.[0]?.emailAddress || user?.email,
      fullName: user?.fullName,
      adminEnvVar: process.env.ADMIN_USER_IDS,
      isAdminCheck: clerkId ? isAdmin(clerkId) : false,
      // Only include this in development
      ...(process.env.NODE_ENV === 'development' && {
        allEnvAdminIds: process.env.ADMIN_USER_IDS?.split(',') || [],
      })
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      authenticated: false,
    })
  }
}
