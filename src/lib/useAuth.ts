'use client'

// Unified auth hook that works with both Clerk and mock auth
import { useAuth as useClerkAuth } from '@clerk/nextjs'
import { useMockAuth } from './useMockAuth'
import { useEffect, useState } from 'react'

const hasValidClerkKey = typeof window !== 'undefined'
  ? !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder')
  : false

export function useAuth() {
  // Use Clerk auth if keys are valid, otherwise use mock auth
  const clerkAuth = useClerkAuth()
  const mockAuth = useMockAuth()

  if (hasValidClerkKey) {
    return {
      isSignedIn: clerkAuth.isSignedIn,
      isLoaded: clerkAuth.isLoaded,
      user: clerkAuth.user,
      userId: clerkAuth.userId,
      signOut: () => clerkAuth.signOut(),
    }
  }

  return {
    isSignedIn: mockAuth.isSignedIn,
    isLoaded: !mockAuth.isLoading,
    user: mockAuth.user ? {
      id: mockAuth.user.id,
      username: mockAuth.user.username,
      firstName: mockAuth.user.displayName.split(' ')[0],
      lastName: mockAuth.user.displayName.split(' ')[1] || '',
      emailAddress: mockAuth.user.email,
      primaryEmailAddress: { emailAddress: mockAuth.user.email },
    } : null,
    userId: mockAuth.user?.id,
    signOut: () => mockAuth.signOut(),
  }
}

// Helper to get mock user ID for protected routes
export function getMockUserId(): string | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('massoteric_mock_auth')
  return stored ? JSON.parse(stored).id : null
}
