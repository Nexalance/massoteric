export const dynamic = 'force-dynamic'
// src/app/settings/billing/page.tsx

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BillingContent } from './BillingContent'
import { syncSubscriptionFromStripe } from '@/lib/stripe'

export const metadata = { title: 'Billing & Subscription' }

export default async function BillingPage({ searchParams }: { searchParams: { success?: string; canceled?: string } }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, subscriptionTier: true, subscriptionStatus: true, stripeCustomerId: true },
  })
  if (!user) redirect('/onboarding')

  // Server-side sync: When returning from successful Stripe payment, sync immediately
  // This happens before the page renders, ensuring the user sees their updated plan
  if (searchParams.success === 'true' && user.stripeCustomerId) {
    console.log('🔄 Auto-syncing subscription for user:', user.id, 'after successful payment')
    await syncSubscriptionFromStripe(user.id)

    // Redirect to clean URL (remove query params) - the subscription is now synced
    redirect('/settings/billing')
  }

  return (
    <main>
      <BillingContent
        initialTier={user.subscriptionTier}
        subscriptionStatus={user.subscriptionStatus}
        hasStripeCustomer={!!user.stripeCustomerId}
        paymentCanceled={searchParams.canceled === 'true'}
      />
    </main>
  )
}
