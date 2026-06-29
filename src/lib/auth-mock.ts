// src/lib/auth-mock.ts
// Mock auth for development without Clerk keys

const hasValidClerkKey = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder')

export async function auth() {
  if (hasValidClerkKey) {
    // Use real Clerk auth
    const { auth: clerkAuth } = require('@clerk/nextjs/server')
    return clerkAuth()
  }

  // Mock auth for development
  return {
    userId: 'dev-user-123',
    user: {
      id: 'dev-user-123',
      username: 'devuser',
      displayName: 'Dev User',
      email: 'dev@example.com',
    },
  }
}
