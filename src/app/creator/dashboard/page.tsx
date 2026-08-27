// src/app/creator/dashboard/page.tsx
// Creator Dashboard - earnings, subscribers, payout management

export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import Link from 'next/link'
import CreatorDashboardClient from './CreatorDashboardClient'
import PayoutRequestClient from './PayoutRequestClient'

export const metadata = { title: 'Creator Dashboard' }

export default async function CreatorDashboardPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  // Get user with creator settings
  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      creatorSettings: true,
      subscribers: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      payouts: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!dbUser) redirect('/feed')

  // Check if user has set up creator account
  const isOnboarded = dbUser.stripeOnboardingComplete
  const hasAccount = !!dbUser.stripeAccountId

  // Calculate stats
  const activeSubscribers = dbUser.subscribers.length
  const monthlyRevenueCents = dbUser.subscribers.reduce(
    (sum, sub) => sum + sub.monthlyPriceCents,
    0
  )
  const platformFeeBps = dbUser.creatorSettings?.platformFeeBps || 2000
  const platformEarningsCents = dbUser.subscribers.reduce(
    (sum, sub) => sum + Math.round((sub.monthlyPriceCents * sub.platformFeeBps) / 10000),
    0
  )
  const creatorEarningsCents = monthlyRevenueCents - platformEarningsCents

  const completedPayouts = dbUser.payouts.filter(p => p.status === 'COMPLETED')
  const pendingPayouts = dbUser.payouts.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING')
  const totalPaidCents = completedPayouts.reduce((sum, p) => sum + p.amountCents, 0)
  const totalPendingCents = pendingPayouts.reduce((sum, p) => sum + p.amountCents, 0)

  // Query Stripe connected account balance for accurate available amount
  let availableBalanceCents = 0
  if (dbUser.stripeAccountId && stripe) {
    try {
      const balance = await stripe.balance.retrieve({
        stripeAccount: dbUser.stripeAccountId,
      })
      // Get available balance (excluding pending)
      availableBalanceCents = balance.available[0].amount // USD is typically index 0
    } catch (err) {
      console.error('Failed to fetch Stripe balance:', err)
    }
  }

  const stats = {
    activeSubscribers,
    monthlyRevenue: monthlyRevenueCents / 100,
    platformEarnings: platformEarningsCents / 100,
    creatorEarnings: creatorEarningsCents / 100,
    totalPaid: totalPaidCents / 100,
    totalPending: totalPendingCents / 100,
    availableBalance: availableBalanceCents / 100, // Actual Stripe balance
    monthlyPrice: (dbUser.creatorSettings?.monthlyPriceCents || 999) / 100,
    platformFeePercent: platformFeeBps / 100,
  }

  return (
    <main>
      <div className="page-container" style={{ paddingTop: '40px', paddingBottom: '64px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="section-label">Creator</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 300, color: 'var(--cream)' }}>
              Dashboard
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/creator/settings" className="btn btn-secondary">Settings</Link>
            <Link href={`/profile/${dbUser.username}`} className="btn btn-primary">View Profile</Link>
          </div>
        </div>

        {/* Onboarding Call-to-Action */}
        {!isOnboarded && (
          <div className="card" style={{ padding: '24px', marginBottom: '24px', border: '2px solid var(--gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--cream)', marginBottom: '8px' }}>
                  {hasAccount ? 'Complete Your Stripe Setup' : 'Start Earning from Your Predictions'}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--mist)', marginBottom: '12px' }}>
                  {hasAccount
                    ? 'Finish your Stripe Connect onboarding to start accepting paid subscriptions.'
                    : 'Set up your Stripe Connect account to enable paid subscriptions and earn from your followers.'}
                </p>
              </div>
              <CreatorDashboardClient
                hasAccount={hasAccount}
                username={dbUser.username}
              />
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="profile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '32px' }}>
          {[
            { label: 'Active Subscribers', value: activeSubscribers.toLocaleString(), sub: 'paid subscribers' },
            { label: 'Monthly Revenue', value: `$${stats.monthlyRevenue.toFixed(0)}`, sub: `${activeSubscribers} subscribers × $${stats.monthlyPrice}/mo` },
            { label: 'Your Earnings (85%)', value: `$${stats.creatorEarnings.toFixed(0)}`, sub: 'after platform fee' },
            { label: 'Platform Fee (15%)', value: `$${stats.platformEarnings.toFixed(0)}`, sub: 'platform revenue' },
            { label: 'Total Paid Out', value: `$${stats.totalPaid.toFixed(0)}`, sub: 'completed payouts' },
            { label: 'Pending Payouts', value: `$${stats.totalPending.toFixed(0)}`, sub: 'awaiting processing' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: 'var(--cream)' }}>
                {value}
              </div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--cream)', margin: '4px 0 2px' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mist)' }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Revenue Share Info */}
        <div className="card" style={{ padding: '16px', marginBottom: '24px', backgroundColor: 'var(--fog)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--mist)', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
                REVENUE SPLIT
              </span>
              <div style={{ fontSize: '14px', color: 'var(--cream)', marginTop: '4px' }}>
                You keep <strong>{100 - stats.platformFeePercent}%</strong> of every subscription • Platform takes <strong>{stats.platformFeePercent}%</strong>
              </div>
            </div>
            <Link href="/creator/settings" className="btn btn-secondary" style={{ fontSize: '12px', padding: '8px 16px' }}>
              Adjust Pricing
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Recent Subscribers */}
          <div>
            <div className="section-label">Recent Subscribers</div>
            <div className="card">
              {dbUser.subscribers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--mist)' }}>
                  No subscribers yet. Share your profile to start earning!
                </div>
              ) : (
                dbUser.subscribers.map((sub, i) => (
                  <div
                    key={sub.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: i < dbUser.subscribers.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--cream)', fontWeight: 500 }}>
                        Subscriber
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mist)' }}>
                        Since {new Date(sub.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--signal)' }}>
                      ${(sub.monthlyPriceCents / 100).toFixed(2)}/mo
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payout History */}
          <div>
            <div className="section-label">Payout History</div>
            <div className="card">
              {dbUser.payouts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--mist)' }}>
                  No payouts yet. Request a payout when you have earnings.
                </div>
              ) : (
                dbUser.payouts.map((payout, i) => (
                  <div
                    key={payout.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: i < dbUser.payouts.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--cream)', fontWeight: 500 }}>
                        ${(payout.amountCents / 100).toFixed(2)}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mist)' }}>
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        payout.status === 'COMPLETED'
                          ? 'badge-paid'
                          : payout.status === 'FAILED'
                          ? 'badge-alert'
                          : 'badge-category'
                      }`}
                    >
                      {payout.status.toLowerCase()}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Payout Request */}
            <PayoutRequestClient
              availableBalance={stats.availableBalance || 0}
              username={dbUser.username}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
