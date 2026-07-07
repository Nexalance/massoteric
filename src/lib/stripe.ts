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
 * Sync a user's subscription from Stripe.
 * This function queries Stripe directly and updates the user's subscription in the database.
 * Useful for auto-syncing after checkout or as a fallback when webhooks fail.
 *
 * @param userId - The user's ID in our database
 * @returns Object with success status, new tier, and subscription details
 */
export async function syncSubscriptionFromStripe(userId: string) {
  if (!isStripeConfigured()) {
    return { success: false, error: 'Stripe not configured' }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, subscriptionTier: true, subscriptionStatus: true }
  })

  if (!user) {
    return { success: false, error: 'User not found' }
  }

  if (!user.stripeCustomerId) {
    return { success: false, error: 'No Stripe customer found' }
  }

  try {
    // List all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'all',
      limit: 10,
    })

    if (subscriptions.data.length === 0) {
      // No subscriptions found - reset to FREE
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionTier: 'FREE', subscriptionStatus: 'CANCELED' }
      })

      return {
        success: true,
        message: 'No active subscriptions found. Reset to FREE tier.',
        subscriptionTier: 'FREE',
        subscriptionStatus: 'CANCELED'
      }
    }

    // Get the most recent active subscription
    const activeSubscription = subscriptions.data
      .filter(s => s.status === 'active' || s.status === 'trialing')
      .sort((a, b) => b.created - a.created)[0]

    if (!activeSubscription) {
      // No active subscription - check if canceled
      const canceledSubscription = subscriptions.data[0]
      if (canceledSubscription?.status === 'canceled' || canceledSubscription?.status === 'incomplete_expired') {
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionTier: 'FREE', subscriptionStatus: 'CANCELED' }
        })

        return {
          success: true,
          message: 'Subscription is canceled. Downgraded to FREE tier.',
          subscriptionTier: 'FREE',
          subscriptionStatus: 'CANCELED'
        }
      }

      return {
        success: false,
        error: 'No active subscription found',
        currentTier: user.subscriptionTier,
        currentStatus: user.subscriptionStatus
      }
    }

    // Determine tier from price ID
    const priceId = activeSubscription.items.data[0].price.id
    let tier: 'STANDARD' | 'PRO' = 'STANDARD'

    if (priceId === process.env.STRIPE_PRICE_PRO) {
      tier = 'PRO'
    } else if (priceId === process.env.STRIPE_PRICE_STANDARD) {
      tier = 'STANDARD'
    }

    // Map Stripe status to our SubscriptionStatus (TRIALING -> ACTIVE since we don't have a separate TRIALING status)
    const subscriptionStatus: 'ACTIVE' = 'ACTIVE' // Both active and trialing map to ACTIVE

    // Update user's subscription
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: tier,
        subscriptionStatus,
      },
    })

    // Update or create platform subscription record
    await prisma.platformSubscription.upsert({
      where: { stripeSubscriptionId: activeSubscription.id },
      update: {
        tier,
        status: subscriptionStatus,
        currentPeriodStart: new Date(activeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
      },
      create: {
        userId,
        stripeSubscriptionId: activeSubscription.id,
        stripePriceId: priceId,
        tier,
        status: subscriptionStatus,
        currentPeriodStart: new Date(activeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000),
      },
    })

    return {
      success: true,
      message: `Subscription synced successfully. You are now on ${tier} tier.`,
      subscriptionTier: tier,
      subscriptionStatus: 'ACTIVE', // Both active and trialing map to ACTIVE
      subscription: {
        id: activeSubscription.id,
        status: activeSubscription.status,
        currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000),
      }
    }

  } catch (error) {
    console.error('Subscription sync error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync subscription'
    }
  }
}

/**
 * Handle Stripe webhook events.
 * Called from /api/webhooks/stripe
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  console.log('🔔 Stripe webhook received:', event.type, event.id)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('Checkout session completed:', session.id, 'mode:', session.mode)

      if (session.mode !== 'subscription') {
        console.log('Skipping non-subscription checkout')
        break
      }

      const subscriptionId = session.subscription as string
      console.log('Subscription ID:', subscriptionId)
      console.log('Session metadata:', session.metadata)

      // Get metadata from session first
      let { userId, tier } = session.metadata!

      // If not in session metadata, fetch the subscription to get it
      if (!userId || !tier) {
        console.log('Metadata not in session, fetching subscription...')
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        console.log('Subscription metadata:', subscription.metadata)

        // Try to get metadata from subscription
        if (!userId) userId = subscription.metadata.userId
        if (!tier) tier = subscription.metadata.tier
      }

      if (!userId || !tier) {
        console.error('❌ Missing userId or tier in metadata')
        console.error('Session metadata:', session.metadata)
        throw new Error('Missing userId or tier in checkout session metadata')
      }

      console.log('Processing subscription for user:', userId, 'tier:', tier)

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)

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

      console.log('✅ Subscription activated for user:', userId, 'tier:', tier)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      console.log('Subscription updated:', subscription.id, 'status:', subscription.status)

      let userId = subscription.metadata.userId
      if (!userId) {
        console.log('❌ No userId in subscription metadata, looking up by customer...')
        // Fallback: try to find user by stripeCustomerId
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string }
        })
        if (user) {
          userId = user.id
          console.log('Found user by stripeCustomerId:', userId)
        }
      }

      if (!userId) {
        console.error('❌ Could not determine userId for subscription:', subscription.id)
        break
      }

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

      console.log('✅ Subscription updated for user:', userId, 'tier:', tier, 'status:', status)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      console.log('Subscription deleted/canceled:', subscription.id)

      let userId = subscription.metadata.userId
      if (!userId) {
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string }
        })
        if (user) userId = user.id
      }

      if (!userId) {
        console.error('❌ Could not determine userId for subscription:', subscription.id)
        break
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: 'FREE',
          subscriptionStatus: 'CANCELED',
        },
      })

      await prisma.platformSubscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: 'CANCELED',
          tier: 'FREE',
        },
      })

      console.log('✅ Subscription canceled for user:', userId)
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      console.log('Invoice paid:', invoice.id, 'subscription:', invoice.subscription)

      // Refresh subscription status after successful payment
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        let userId = subscription.metadata.userId

        if (!userId) {
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: subscription.customer as string }
          })
          if (user) userId = user.id
        }

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: 'ACTIVE',
              subscriptionTier: priceToTier(subscription.items.data[0].price.id),
            },
          })
          console.log('✅ User subscription status refreshed after invoice payment:', userId)
        }
      }
      break
    }

    default:
      console.log('Unhandled webhook event:', event.type)
  }
}
