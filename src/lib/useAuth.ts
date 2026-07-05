'use client'

// Unified auth hook that works with both Clerk and mock auth
import { useAuth as useClerkAuth } from '@clerk/nextjs'
import { useMockAuth } from './useMockAuth'
import { useEffect, useState } from 'react'
import { useContext } from 'react'

const hasValidClerkKey = typeof window !== 'undefined'
  ? !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder')
  : false

export function useAuth() {
  // Try to use Clerk auth first - will throw if not within ClerkProvider
  let clerkAuth
  try {
    clerkAuth = useClerkAuth()
  } catch (e) {
    // Not within ClerkProvider, fall through to mock
  }

  // Try to use mock auth - will throw if not within MockAuthProvider
  let mockAuth
  try {
    mockAuth = useMockAuth()
  } catch (e) {
    // Not within MockAuthProvider
  }

  // Return appropriate auth based on available provider
  if (hasValidClerkKey && clerkAuth) {
    return {
      isSignedIn: clerkAuth.isSignedIn,
      isLoaded: clerkAuth.isLoaded,
      user: clerkAuth.user,
      userId: clerkAuth.userId,
      signOut: () => clerkAuth.signOut(),
    }
  }

  if (mockAuth) {
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
        clerkId: mockAuth.user.id,
        displayName: mockAuth.user.displayName,
        email: mockAuth.user.email,
        subscriptionTier: mockAuth.user.subscriptionTier,
        isAdmin: mockAuth.user.isAdmin,
      } : null,
      userId: mockAuth.user?.id,
      signOut: () => mockAuth.signOut(),
    }
  }

  // No provider available (e.g., during build or SSR)
  // Return a safe default state
  return {
    isSignedIn: false,
    isLoaded: false,
    user: null,
    userId: null,
    signOut: () => {},
  }
}

// Helper to get mock user ID for protected routes
export function getMockUserId(): string | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('massoteric_mock_auth')
  return stored ? JSON.parse(stored).id : null
}
