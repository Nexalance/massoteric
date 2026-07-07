// src/lib/auth-mock.ts
// Mock auth for development without Clerk keys
// Auto-creates users in database when they first authenticate with Clerk

import { prisma } from './prisma'
import { syncSubscriptionFromStripe, isStripeConfigured } from './stripe'
import { isAdmin } from './admin'

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
  // Skip during build time (when NEXT_PHASE is set by Next.js build)
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production') {
    return
  }

  try {
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
      console.log('✅ Dev user created')
    }
  } catch (error) {
    console.error('❌ Error ensuring dev user exists:', error)
    // Don't throw - allow the app to continue and handle auth failure in the route handler
  }
}

// Sync Clerk user to database (create if doesn't exist, update if missing data)
async function syncClerkUserToDb(clerkId: string, clerkUser?: any) {
  try {
    // Check if user already exists
    let existing = await prisma.user.findUnique({
      where: { clerkId }
    })

    // Extract data from Clerk user
    const clerkUsername = clerkUser?.username ||
      clerkUser?.firstName?.toLowerCase() + (clerkUser?.lastName?.toLowerCase() || '') ||
      `user_${Date.now().toString(36)}`

    const clerkDisplayName = clerkUser?.fullName ||
      clerkUser?.firstName + ' ' + (clerkUser?.lastName || '') ||
      'User'

    // Find primary email address from Clerk
    let clerkEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ||
      clerkUser?.email ||
      `${clerkUsername}@example.com`

    // If user has emailAddresses array, find the primary one
    if (clerkUser?.emailAddresses && Array.isArray(clerkUser.emailAddresses)) {
      const primaryEmail = clerkUser.emailAddresses.find((e: any) => e.id === clerkUser.primaryEmailAddressId)
      if (primaryEmail?.emailAddress) {
        clerkEmail = primaryEmail.emailAddress
      }
    }

    // If user exists, update missing/undefined values
    if (existing) {
      // Check if user is admin - admins always get PRO tier
      const userIsAdmin = isAdmin(clerkId)

      // Check if we need to update any missing fields
      const needsUpdate = !existing.displayName || !existing.email ||
                          (userIsAdmin && existing.subscriptionTier !== 'PRO')

      if (needsUpdate && clerkUser) {
        existing = await prisma.user.update({
          where: { clerkId },
          data: {
            displayName: existing.displayName || clerkDisplayName,
            email: existing.email || clerkEmail,
            // Admin users always have PRO tier
            ...(userIsAdmin && existing.subscriptionTier !== 'PRO' ? { subscriptionTier: 'PRO' } : {}),
          }
        })
        console.log('✅ Updated user from Clerk:', existing.username, userIsAdmin ? '(Admin → PRO)' : '')
      }

      // Auto-sync subscription from Stripe if user has a Stripe customer ID
      // This ensures subscribed users always have the correct tier when they sign in
      // Skip for admins since they already have PRO
      if (existing.stripeCustomerId && isStripeConfigured() && !userIsAdmin) {
        try {
          const syncResult = await syncSubscriptionFromStripe(existing.id)
          if (syncResult.success) {
            console.log('✅ Auto-synced subscription for user:', existing.username, 'tier:', syncResult.subscriptionTier)
          }
        } catch (error) {
          console.log('⚠️ Could not sync subscription from Stripe:', error.message)
        }
      }

      return existing
    }

    // User doesn't exist - create from Clerk data
    const username = clerkUsername

    const displayName = clerkDisplayName

    const email = clerkEmail

    // Create a unique username by adding random suffix if needed
    let finalUsername = username
    let attempts = 0
    while (attempts < 5) {
      const existing = await prisma.user.findUnique({
        where: { username: finalUsername }
      })
      if (!existing) break
      finalUsername = `${username}${Math.random().toString(36).slice(2, 8)}`
      attempts++
    }

    // Check if user is admin - admins get PRO tier immediately
    const userIsAdmin = isAdmin(clerkId)

    const newUser = await prisma.user.create({
      data: {
        clerkId,
        username: finalUsername,
        displayName: displayName.trim(),
        email,
        onboardingComplete: false,
        subscriptionTier: userIsAdmin ? 'PRO' : 'FREE',
      }
    })

    console.log('✅ Auto-created user from Clerk:', finalUsername, userIsAdmin ? '(Admin → PRO)' : '')
    return newUser
  } catch (error) {
    console.error('❌ Error syncing Clerk user to database:', error)
    // Return null to indicate failure - caller can handle gracefully
    return null
  }
}

export async function auth() {
  if (hasValidClerkKey) {
    // Use real Clerk auth
    const { auth: clerkAuth, currentUser } = require('@clerk/nextjs/server')
    const result = await clerkAuth()

    // Auto-sync user to database if they exist in Clerk but not in DB
    if (result?.userId) {
      // Try to get full user data from Clerk API
      let clerkUser = result.user

      // If user data is incomplete, fetch from currentUser
      if (!clerkUser?.emailAddresses && !clerkUser?.fullName) {
        try {
          const userResult = await currentUser()
          clerkUser = userResult
        } catch (e) {
          console.log('Could not fetch full user from Clerk:', e.message)
        }
      }

      await syncClerkUserToDb(result.userId, clerkUser)
    }

    return result
  }

  // Mock auth for development - ensure user exists first
  await ensureDevUser()

  return {
    userId: DEV_USER.clerkId,
    user: DEV_USER,
  }
}
