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
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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

  // Handle Stripe Connect webhook events first
  if (event.account) {
    await handleStripeConnectWebhook(event)
    return
  }

  console.log('🔔 Stripe webhook received:', event.type, event.id)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.mode !== 'subscription') {
        break
      }

      const subscriptionId = session.subscription as string

      // Check if this is a creator subscription
      if (session.metadata.massotericCheckout === 'creator-subscription') {
        const creatorId = session.metadata.creatorId
        const subscriberId = session.metadata.subscriberId

        if (!creatorId || !subscriberId) {
          console.error('❌ Missing creatorId or subscriberId in creator subscription metadata')
          throw new Error('Missing creatorId or subscriberId in creator subscription metadata')
        }

        await syncCreatorSubscriptionFromStripe(subscriptionId, creatorId, subscriberId)
        break
      }

      // Otherwise, handle platform subscription (existing code)
      // Get metadata from session first
      let { userId, tier } = session.metadata!

      // If not in session metadata, fetch the subscription to get it
      if (!userId || !tier) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        // Try to get metadata from subscription
        if (!userId) userId = subscription.metadata.userId
        if (!tier) tier = subscription.metadata.tier
      }

      if (!userId || !tier) {
        console.error('❌ Missing userId or tier in metadata')
        throw new Error('Missing userId or tier in checkout session metadata')
      }

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

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription

      // Check if this is a creator subscription
      if (subscription.metadata.massotericCreatorSub === 'true') {
        const creatorId = subscription.metadata.creatorId
        const subscriberId = subscription.metadata.subscriberId

        if (creatorId && subscriberId) {
          await syncCreatorSubscriptionFromStripe(subscription.id, creatorId, subscriberId)
          break
        }
      }

      // Otherwise, handle platform subscription (existing code)
      let userId = subscription.metadata.userId
      if (!userId) {
        // Fallback: try to find user by stripeCustomerId
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string }
        })
        if (user) {
          userId = user.id
        }
      }

      if (!userId) {
        console.error('❌ Could not determine userId for subscription:', subscription.id)
        throw new Error(`Could not determine userId for subscription: ${subscription.id}`)
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

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      // Check if this is a creator subscription
      if (subscription.metadata.massotericCreatorSub === 'true') {
        const creatorId = subscription.metadata.creatorId
        const subscriberId = subscription.metadata.subscriberId

        if (creatorId && subscriberId) {

          // Update the UserSubscription record to canceled
          await prisma.userSubscription.updateMany({
            where: {
              subscriberId,
              expertId: creatorId,
              stripeSubscriptionId: subscription.id,
            },
            data: {
              status: 'CANCELED',
            },
          })

          break
        }
      }

      // Otherwise, handle platform subscription (existing code)
      let userId = subscription.metadata.userId
      if (!userId) {
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string }
        })
        if (user) userId = user.id
      }

      if (!userId) {
        console.error('❌ Could not determine userId for subscription:', subscription.id)
        throw new Error(`Could not determine userId for subscription: ${subscription.id}`)
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

      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice

      // Refresh subscription status after successful payment
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)

        // Check if this is a creator subscription
        if (subscription.metadata.massotericCreatorSub === 'true') {
          const creatorId = subscription.metadata.creatorId
          const subscriberId = subscription.metadata.subscriberId

          if (creatorId && subscriberId) {
            await syncCreatorSubscriptionFromStripe(subscription.id, creatorId, subscriberId)
            break
          }
        }

        // Otherwise, handle platform subscription (existing code)
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
        }
      }
      break
    }

    default:
  }
}

// ─────────────────────────────────────────────────────────
// STRIPE CONNECT (Creator Monetization)
// ─────────────────────────────────────────────────────────

/**
 * Create a Stripe Connect Express account for a creator.
 * This creates an account and returns the onboarding URL.
 */
export async function createCreatorAccount(userId: string): Promise<{ accountId: string; url: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  // Check if user already has a Stripe Connect account
  if (user.stripeAccountId) {
    // Return existing account link if onboarding not complete
    if (!user.stripeOnboardingComplete) {
      const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const refreshUrl = `${appUrl}/creator/onboarding?refresh=true`
      const returnUrl = `${appUrl}/creator/onboarding?success=true`
      try {
        const accountLink = await stripe.accountLinks.create({
          account: user.stripeAccountId,
          refresh_url: refreshUrl,
          return_url: returnUrl,
          type: 'account_onboarding',
        })
        return { accountId: user.stripeAccountId, url: accountLink.url }
      } catch (stripeError: any) {
        console.error('Stripe account link creation error:', stripeError)
        throw new Error(`Stripe error: ${stripeError.message}`)
      }
    }
    throw new Error('Creator already has a complete Stripe account')
  }

  // Create new Express account
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://massoteric.com'

  // For business_profile URL, use the production domain (Stripe doesn't accept localhost)
  // This is just for Stripe's records - doesn't affect the actual app functionality
  const businessUrl = 'https://massoteric.com'
  const profileUrl = user.username ? `${businessUrl}/profile/${user.username}` : businessUrl

  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    email: user.email,
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
    business_type: 'individual',
    business_profile: {
      url: profileUrl,
      mcc: '5734', // Computer software stores
    },
    metadata: { massotericUserId: userId },
  })


  // Save account ID to user
  await prisma.user.update({
    where: { id: userId },
    data: { stripeAccountId: account.id },
  })

  // Create account onboarding link - use localhost for these (works in test mode)
  const refreshUrl = `${appUrl}/creator/onboarding?refresh=true`
  const returnUrl = `${appUrl}/creator/onboarding?success=true`

  try {
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })
    return { accountId: account.id, url: accountLink.url }
  } catch (stripeError: any) {
    console.error('Stripe account link creation error:', stripeError)
    throw new Error(`Stripe error: ${stripeError.message}`)
  }
}

/**
 * Get or create creator settings with default values.
 */
export async function getOrCreateCreatorSettings(userId: string) {
  return prisma.creatorSettings.upsert({
    where: { userId },
    create: {
      userId,
      monthlyPriceCents: 999, // $9.99 default
      platformFeeBps: 1500,   // 15% default
    },
    update: {},
  })
}

/**
 * Create a Stripe Checkout session for subscribing to a creator.
 * This includes the platform fee via application_fee_amount.
 */
export async function createCreatorSubscriptionCheckout(
  subscriberId: string,
  creatorId: string
): Promise<{ url: string; subscriptionId: string }> {
  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    include: { creatorSettings: true },
  })

  if (!creator) throw new Error('Creator not found')
  if (!creator.stripeAccountId) throw new Error('Creator has not set up Stripe Connect')
  if (!creator.stripeOnboardingComplete) throw new Error('Creator onboarding not complete')
  if (!creator.creatorSettings) throw new Error('Creator settings not found')

  const priceCents = creator.creatorSettings.monthlyPriceCents
  const platformFeeBps = creator.creatorSettings.platformFeeBps

  // Calculate platform fee (20% default: platformFeeBps / 10000)
  const platformFeeCents = Math.round((priceCents * platformFeeBps) / 10000)

  // Get or create Stripe customer for subscriber
  const customerId = await getOrCreateStripeCustomer(subscriberId)

  // First, create a product and price for this creator (or use existing)
  // For simplicity, we'll create a new price each time
  const product = await stripe.products.create({
    name: `Subscribe to @${creator.username}`,
    description: `Monthly subscription to ${creator.displayName}'s predictions on Massoteric`,
    metadata: { creatorId, massoteric: 'true' },
  })

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: priceCents,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { creatorId },
  })

  // Create checkout session with transfer_data for Express accounts
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        creatorId,
        subscriberId,
        platformFeeBps: platformFeeBps.toString(),
        massotericCreatorSub: 'true',
      },
      application_fee_percent: platformFeeBps / 100, // Convert basis points to percentage (Stripe expects number, not string)
      transfer_data: {
        destination: creator.stripeAccountId,
        // Note: When using application_fee_percent, Stripe automatically calculates amounts.
        // Do not specify 'amount' here as it conflicts with application_fee_percent.
      },
    },
    success_url: `${appUrl}/profile/${creator.username}?subscribed=true`,
    cancel_url: `${appUrl}/profile/${creator.username}?canceled=true`,
    metadata: {
      creatorId,
      subscriberId,
      massotericCheckout: 'creator-subscription',
    },
  })

  return {
    url: session.url!,
    subscriptionId: session.id!,
  }
}

/**
 * Calculate creator earnings from subscription amount.
 * @param amountCents - Total subscription amount in cents
 * @param platformFeeBps - Platform fee in basis points (1500 = 15%)
 * @returns Creator earnings in cents
 */
export function calculateCreatorEarnings(amountCents: number, platformFeeBps: number): number {
  const platformFeeCents = Math.round((amountCents * platformFeeBps) / 10000)
  return amountCents - platformFeeCents
}

/**
 * Request a payout for a creator.
 * Creates a payout record and initiates the Stripe transfer.
 */
export async function requestCreatorPayout(userId: string, amountCents: number): Promise<Payout> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) throw new Error('User not found')
  if (!user.stripeAccountId) throw new Error('No Stripe Connect account found')
  if (!user.stripeOnboardingComplete) throw new Error('Stripe onboarding not complete')

  // Create payout record
  const payout = await prisma.payout.create({
    data: {
      userId,
      amountCents,
      status: 'PENDING',
    },
  })

  // Initiate Stripe transfer
  try {
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: user.stripeAccountId,
      metadata: {
        payoutId: payout.id,
        userId,
      },
    })

    // Update payout with transfer ID
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        stripeTransferId: transfer.id,
        status: 'PROCESSING',
      },
    })

    return payout
  } catch (error) {
    // Mark as failed
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: 'FAILED',
        notes: error instanceof Error ? error.message : 'Transfer failed',
      },
    })
    throw error
  }
}

/**
 * Process an existing payout request (for admin approval).
 * Updates the existing payout record and initiates the Stripe transfer.
 * Use this when approving a pending payout request to avoid creating duplicates.
 */
export async function processCreatorPayout(payoutId: string): Promise<void> {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: {
      user: {
        select: {
          id: true,
          stripeAccountId: true,
          stripeOnboardingComplete: true,
        },
      },
    },
  })

  if (!payout) throw new Error('Payout not found')
  if (payout.status !== 'PENDING') throw new Error('Payout already processed')
  if (!payout.user.stripeAccountId) throw new Error('No Stripe Connect account found')
  if (!payout.user.stripeOnboardingComplete) throw new Error('Stripe onboarding not complete')

  // Initiate Stripe transfer
  const transfer = await stripe.transfers.create({
    amount: payout.amountCents,
    currency: 'usd',
    destination: payout.user.stripeAccountId,
    metadata: {
      payoutId: payout.id,
      userId: payout.user.id,
    },
  })

  // Update existing payout with transfer ID and status
  await prisma.payout.update({
    where: { id: payoutId },
    data: {
      stripeTransferId: transfer.id,
      status: 'PROCESSING',
    },
  })
}

/**
 * Get creator dashboard stats (earnings, subscribers, etc.)
 */
export async function getCreatorStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      creatorSettings: true,
      subscribers: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          subscriberId: true,
          monthlyPriceCents: true,
          platformFeeBps: true,
          createdAt: true,
        },
      },
      payouts: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!user) throw new Error('User not found')

  // Query Stripe connected account balance for accurate available amount
  let availableBalanceCents = 0
  if (user.stripeAccountId && stripe) {
    try {
      const balance = await stripe.balance.retrieve({
        stripeAccount: user.stripeAccountId,
      })
      // Get available balance (excluding pending)
      availableBalanceCents = balance.available[0].amount // USD is typically index 0
    } catch (err) {
      console.error('Failed to fetch Stripe balance:', err)
    }
  }

  const activeSubscribers = user.subscribers.length
  const monthlyRevenueCents = user.subscribers.reduce(
    (sum, sub) => sum + sub.monthlyPriceCents,
    0
  )
  const platformEarningsCents = user.subscribers.reduce(
    (sum, sub) => sum + Math.round((sub.monthlyPriceCents * sub.platformFeeBps) / 10000),
    0
  )
  const creatorEarningsCents = monthlyRevenueCents - platformEarningsCents

  const completedPayouts = user.payouts.filter(p => p.status === 'COMPLETED')
  const pendingPayouts = user.payouts.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING')
  const totalPaidCents = completedPayouts.reduce((sum, p) => sum + p.amountCents, 0)
  const totalPendingCents = pendingPayouts.reduce((sum, p) => sum + p.amountCents, 0)

  return {
    activeSubscribers,
    monthlyRevenue: monthlyRevenueCents / 100, // Convert to dollars
    platformEarnings: platformEarningsCents / 100,
    creatorEarnings: creatorEarningsCents / 100,
    totalPaid: totalPaidCents / 100,
    totalPending: totalPendingCents / 100,
    availableBalance: availableBalanceCents / 100, // Actual Stripe balance
    settings: user.creatorSettings,
    recentPayouts: user.payouts,
  }
}

/**
 * Handle Stripe Connect webhook events.
 * Processes account updates, payout completions, etc.
 */
async function handleStripeConnectWebhook(event: Stripe.Event): Promise<void> {

  switch (event.type) {
    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      const userId = account.metadata.massotericUserId

      if (!userId) {
        console.error('❌ No userId in account metadata')
        break
      }

      // Check if onboarding is complete (payouts_enabled)
      const isComplete = account.payouts_enabled

      await prisma.user.update({
        where: { id: userId },
        data: { stripeOnboardingComplete: isComplete },
      })

      break
    }

    case 'transfer.created':
    case 'transfer.paid':
    case 'transfer.reversed':
    case 'transfer.failed': {
      const transfer = event.data.object as Stripe.Transfer
      console.log('Stripe transfer:', transfer.id, 'status:', transfer.status)

      // Find our payout record by stripeTransferId
      const payoutRecord = await prisma.payout.findFirst({
        where: { stripeTransferId: transfer.id },
      })

      if (payoutRecord) {
        let newStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' = 'PROCESSING'

        if (transfer.status === 'paid' || transfer.status === 'complete') {
          newStatus = 'COMPLETED'
        } else if (transfer.status === 'reversed' || transfer.status === 'failed') {
          newStatus = 'FAILED'
        }

        await prisma.payout.update({
          where: { id: payoutRecord.id },
          data: {
            status: newStatus,
            processedAt: newStatus === 'COMPLETED' ? new Date() : null,
            notes: newStatus === 'FAILED'
              ? `Transfer ${transfer.status}: ${transfer.failure_code || 'Unknown error'}`
              : payoutRecord.notes,
          },
        })
        console.log('✅ Payout record updated via transfer webhook:', payoutRecord.id, 'status:', newStatus)
      } else {
        console.log('⚠️ No payout record found for transfer:', transfer.id)
      }
      break
    }

    default:
      console.log('Unhandled Stripe Connect webhook:', event.type)
  }
}

/**
 * Sync creator subscription from Stripe.
 * Called when a creator subscription webhook is received.
 */
export async function syncCreatorSubscriptionFromStripe(
  subscriptionId: string,
  creatorId: string,
  subscriberId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  const priceId = subscription.items.data[0].price.id
  const price = await stripe.prices.retrieve(priceId)

  // Get platform fee from subscription metadata
  const platformFeeBps = parseInt(subscription.metadata.platformFeeBps || '1500', 10)

  await prisma.userSubscription.upsert({
    where: {
      subscriberId_expertId: {
        subscriberId,
        expertId: creatorId,
      },
    },
    update: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: stripeStatusToOurs(subscription.status),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      monthlyPriceCents: price.unit_amount || 999,
      platformFeeBps,
    },
    create: {
      subscriberId,
      expertId: creatorId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: stripeStatusToOurs(subscription.status),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      monthlyPriceCents: price.unit_amount || 999,
      platformFeeBps,
    },
  })

  console.log('✅ Creator subscription synced:', subscriberId, '->', creatorId, 'status:', stripeStatusToOurs(subscription.status))
}
