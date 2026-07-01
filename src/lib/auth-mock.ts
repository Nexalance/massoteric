// src/lib/auth-mock.ts
// Mock auth for development without Clerk keys

import { prisma } from './prisma'

const hasValidClerkKey = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder')

const DEV_USER = {
  id: 'dev-user-123',
  clerkId: 'dev-user-123',
  username: 'devuser',
  displayName: 'Dev User',
  email: 'dev@example.com',
}

// Ensure dev user exists in database
async function ensureDevUser() {
  const existing = await prisma.user.findUnique({
    where: { clerkId: DEV_USER.clerkId }
  })
  if (!existing) {
    await prisma.user.create({
      data: {
        id: DEV_USER.id,
        clerkId: DEV_USER.clerkId,
        username: DEV_USER.username,
        displayName: DEV_USER.displayName,
        email: DEV_USER.email,
        onboardingComplete: true,
      }
    })
  }
}

export async function auth() {
  if (hasValidClerkKey) {
    // Use real Clerk auth
    const { auth: clerkAuth } = require('@clerk/nextjs/server')
    return clerkAuth()
  }

  // Mock auth for development - ensure user exists first
  await ensureDevUser()

  return {
    userId: DEV_USER.clerkId,
    user: DEV_USER,
  }
}
