// src/app/creator/onboarding/page.tsx
// Handles Stripe Connect onboarding return redirects

export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Creator Onboarding' }

export default async function CreatorOnboardingPage({
  searchParams,
}: {
  searchParams: { success?: string; refresh?: string }
}) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, stripeAccountId: true }
  })

  if (!dbUser) redirect('/feed')

  // Handle successful Stripe onboarding
  if (searchParams.success === 'true' && dbUser.stripeAccountId) {
    // Mark onboarding as complete (will also be updated by webhook, but this is for UX)
    try {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { stripeOnboardingComplete: true },
      })
    } catch (err) {
      console.error('Failed to update onboarding status:', err)
    }

    // Redirect to dashboard with success message
    redirect('/creator/dashboard?onboarding=success')
  }

  // Handle user clicking "back" or refreshing during onboarding
  if (searchParams.refresh === 'true') {
    // Redirect back to dashboard
    redirect('/creator/dashboard?onboarding=refreshed')
  }

  // Default redirect if no params
  redirect('/creator/dashboard')
}
