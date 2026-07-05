// src/lib/stripe.ts
// Stripe integration for platform subscriptions

import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client'

// Validate Stripe API key at startup
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey || stripeSecretKey.includes('placeholder') || !stripeSecretKey.startsWith('sk_')) {
  console.warn('⚠️ Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local to enable subscriptions.')
}

export const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder', {
  apiVersion: '2024-04-10',
  typescript: true,
})

/**
 * Check if Stripe is properly configured.
 */
export function isStripeConfigured(): boolean {
  return !!(
    stripeSecretKey &&
    !stripeSecretKey.includes('placeholder') &&
    stripeSecretKey.startsWith('sk_')
  )
}

/**
 * Get or create a Stripe customer for a user.
 */
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  if (user.stripeCustomerId) return user.stripeCustomerId

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.displayName,
    metadata: { massotericUserId: userId },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

/**
 * Create a Stripe Checkout session for a platform subscription.
 */
export async function createCheckoutSession(
  userId: string,
  priceId: string,
  tier: SubscriptionTier
): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(userId)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings/billing?success=true`,
    cancel_url: `${appUrl}/settings/billing?canceled=true`,
    metadata: { userId, tier },
    subscription_data: {
      metadata: { userId, tier },
    },
  })

  return session.url!
}

/**
 * Create a Stripe Customer Portal session (for managing/canceling subscriptions).
 */
export async function createPortalSession(userId: string): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(userId)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/settings/billing`,
  })

  return session.url
}

/**
 * Map Stripe price ID to our SubscriptionTier.
 */
export function priceToTier(priceId: string): SubscriptionTier {
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'PRO'
  if (priceId === process.env.STRIPE_PRICE_STANDARD) return 'STANDARD'
  return 'FREE'
}

/**
 * Map Stripe subscription status to our SubscriptionStatus.
 */
export function stripeStatusToOurs(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active': return 'ACTIVE'
    case 'canceled': return 'CANCELED'
    case 'past_due': return 'PAST_DUE'
    case 'incomplete': return 'INCOMPLETE'
    default: return 'INCOMPLETE'
  }
}

/**
 * Handle Stripe webhook events.
 * Called from /api/webhooks/stripe
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      if (session.mode !== 'subscription') break

      const { userId, tier } = session.metadata!
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

      await prisma.platformSubscription.upsert({
        where: { stripeSubscriptionId: subscription.id },
        update: {},
        create: {
          userId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          tier: tier as SubscriptionTier,
          status: 'ACTIVE',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      })

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: tier as SubscriptionTier,
          subscriptionStatus: 'ACTIVE',
        },
      })
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata.userId
      if (!userId) break

      const status = stripeStatusToOurs(subscription.status)
      const tier = subscription.status === 'active'
        ? priceToTier(subscription.items.data[0].price.id)
        : 'FREE'

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: tier,
          subscriptionStatus: status,
        },
      })

      await prisma.platformSubscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status,
          tier,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      })
      break
    }
  }
}
