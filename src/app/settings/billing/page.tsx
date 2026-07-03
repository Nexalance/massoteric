export const dynamic = 'force-dynamic'
// src/app/settings/billing/page.tsx

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BillingForm } from './BillingForm'
import { PortalButton } from './PortalButton'

export const metadata = { title: 'Billing & Subscription' }

const PLANS = [
  {
    tier: 'FREE',
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: 'var(--mist)',
    features: [
      'Browse all open prediction markets',
      'View all user predictions and probability estimates',
      'See reasoning snippets (teaser)',
      'Post predictions with reasoning',
      'Basic overall leaderboard',
      'Create profile with background info',
    ],
    locked: [
      'Full reasoning text',
      'Filter by accuracy score',
      'Filter by specific user',
      'Category leaderboards',
      'Expert Q&A access',
    ],
  },
  {
    tier: 'STANDARD',
    name: 'Standard',
    price: '$9',
    period: 'per month',
    color: 'var(--gold)',
    priceId: process.env.STRIPE_PRICE_STANDARD,
    features: [
      'Everything in Free',
      'Full reasoning text on all predictions',
      'Filter predictions by accuracy score',
      'Filter by specific forecaster',
      'Category leaderboards',
      'Priority in topic approval queue',
    ],
    locked: ['Expert Q&A access (Pro only)'],
  },
  {
    tier: 'PRO',
    name: 'Pro',
    price: '$29',
    period: 'per month',
    color: 'var(--signal)',
    priceId: process.env.STRIPE_PRICE_PRO,
    features: [
      'Everything in Standard',
      'Expert Q&A — ask any forecaster questions',
      'Early access to new features',
      'Priority customer support',
      'Export your prediction history',
      'Advanced accuracy analytics',
    ],
    locked: [],
  },
]

export default async function BillingPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { subscriptionTier: true, subscriptionStatus: true, stripeCustomerId: true },
  })
  if (!user) redirect('/onboarding')

  const currentTier = user.subscriptionTier

  return (
    <main>
      <div className="page-container" style={{ paddingTop: '40px', paddingBottom: '64px' }}>
        <div style={{ marginBottom: '40px' }}>
          <div className="section-label">Settings</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 300, color: 'var(--cream)' }}>
            Billing & Subscription
          </h1>
          <p style={{ color: 'var(--mist)', marginTop: '8px' }}>
            Current plan: <strong style={{ color: 'var(--gold)' }}>{currentTier}</strong>
            {user.subscriptionStatus && ` · ${user.subscriptionStatus}`}
          </p>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '40px' }}>
          {PLANS.map(plan => {
            const isCurrent = plan.tier === currentTier
            return (
              <div key={plan.tier} className="card" style={{
                borderTop: `3px solid ${isCurrent ? plan.color : 'transparent'}`,
                position: 'relative',
              }}>
                {isCurrent && (
                  <div style={{ position: 'absolute', top: '-1px', right: '16px', background: plan.color, color: 'var(--ink)', fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '1px', padding: '2px 8px' }}>
                    CURRENT PLAN
                  </div>
                )}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600, color: 'var(--cream)', marginBottom: '4px' }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 300, color: plan.color }}>{plan.price}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mist)' }}>{plan.period}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--mist)' }}>
                      <span style={{ color: 'var(--signal)', flexShrink: 0 }}>✓</span>{f}
                    </div>
                  ))}
                  {plan.locked.map(f => (
                    <div key={f} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--fog)' }}>
                      <span style={{ flexShrink: 0 }}>✗</span>{f}
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  user.stripeCustomerId ? (
                    <PortalButton />
                  ) : (
                    <div className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', cursor: 'default' }}>
                      Current Plan
                    </div>
                  )
                ) : plan.tier === 'FREE' ? (
                  <div className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', cursor: 'default', opacity: 0.5 }}>
                    Downgrade
                  </div>
                ) : (
                  <BillingForm tier={plan.tier} planName={plan.name} color={plan.color} />
                )}
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--fog)' }}>
          All plans include a 7-day free trial. Cancel anytime. Questions? <a href="mailto:hello@massoteric.com" style={{ color: 'var(--gold)' }}>Contact us</a>
        </div>
      </div>
    </main>
  )
}
