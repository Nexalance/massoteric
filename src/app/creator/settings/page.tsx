// src/app/creator/settings/page.tsx
// Creator subscription pricing and revenue share settings

export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import CreatorSettingsClient from './CreatorSettingsClient'

export const metadata = { title: 'Creator Settings' }

export default async function CreatorSettingsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    include: { creatorSettings: true },
  })

  if (!dbUser) redirect('/feed')

  const settings = {
    monthlyPrice: (dbUser.creatorSettings?.monthlyPriceCents || 999) / 100,
    platformFeePercent: (dbUser.creatorSettings?.platformFeeBps || 2000) / 100,
  }

  const isOnboarded = dbUser.stripeOnboardingComplete

  return (
    <main>
      <div className="page-container" style={{ paddingTop: '40px', paddingBottom: '64px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="section-label">Creator</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 300, color: 'var(--cream)' }}>
              Settings
            </h1>
          </div>
          <Link href="/creator/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
        </div>

        {!isOnboarded && (
          <div className="card" style={{ padding: '20px', marginBottom: '24px', border: '2px solid var(--warning)' }}>
            <p style={{ fontSize: '14px', color: 'var(--cream)', marginBottom: '12px' }}>
              ⚠️ You need to complete Stripe Connect onboarding before you can accept paid subscriptions.
            </p>
            <Link href="/creator/dashboard" className="btn btn-primary">
              Complete Setup
            </Link>
          </div>
        )}

        <div style={{ maxWidth: '500px' }}>
          {/* Subscription Pricing */}
          <div style={{ marginBottom: '24px' }}>
            <div className="section-label">Subscription Pricing</div>
            <div className="card" style={{ padding: '20px' }}>
              <CreatorSettingsClient initialSettings={settings} isOnboarded={isOnboarded} />

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '8px' }}>
                  REVENUE BREAKDOWN
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--cream)' }}>Subscriber pays:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cream)' }}>
                    ${settings.monthlyPrice.toFixed(2)}/mo
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--mist)' }}>Platform fee ({settings.platformFeePercent}%):</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--mist)' }}>
                    -${((settings.monthlyPrice * settings.platformFeePercent) / 100).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>
                  <span style={{ color: 'var(--signal)' }}>You receive:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--signal)' }}>
                    ${(settings.monthlyPrice * (1 - settings.platformFeePercent / 100)).toFixed(2)}/mo
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Share Info */}
          <div style={{ marginBottom: '24px' }}>
            <div className="section-label">Revenue Share</div>
            <div className="card" style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--cream)', marginBottom: '12px' }}>
                The platform takes a percentage of each subscription as a fee for providing the infrastructure,
                payment processing, and audience.
              </p>
              <div style={{ fontSize: '12px', color: 'var(--mist)', lineHeight: '1.5' }}>
                <strong>Default: 20% platform fee, 80% to creator</strong><br />
                This default is competitive with creator platforms like Patreon (8-12%), Substack (10%),
                and OnlyFans (20%).
              </div>
            </div>
          </div>

          {/* Public Profile Link */}
          <div>
            <div className="section-label">Your Profile</div>
            <div className="card" style={{ padding: '16px' }}>
              <Link
                href={`/profile/${dbUser.username}`}
                className="btn btn-secondary"
                style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
              >
                View Public Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
