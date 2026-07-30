'use client'

export const dynamic = 'force-dynamic'
import { SignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Check if Clerk is properly configured
const hasValidClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder') &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('pk_test_placeholder')

export default function SignUpCatchAllPage() {
  const router = useRouter()

  // If no valid Clerk keys, redirect to mock sign-up (client-side)
  useEffect(() => {
    if (!hasValidClerkKey) {
      router.push('/sign-up/mock')
    }
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--ink)',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
        {/* Logo/Brand */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: 'bold',
            letterSpacing: '0.2em',
            color: 'var(--cream)',
            lineHeight: '1.2',
          }}>
            MASS<span style={{ color: 'var(--gold)' }}>OTERIC</span>
          </h1>
          <p style={{
            color: 'var(--mist)',
            marginTop: '8px',
            fontSize: '14px',
            letterSpacing: '0.05em',
          }}>
            The Prediction Intelligence Platform
          </p>
        </div>

        <SignUp
          routing="path"
          appearance={{
            variables: {
              colorPrimary: 'var(--gold)',
              colorBackground: 'var(--ink2)',
              colorInputBackground: 'var(--ink3)',
              colorInputText: 'var(--cream)',
              colorText: 'var(--cream)',
              colorMuted: 'var(--mist)',
            },
            elements: {
              rootBox: 'mx-auto',
              card: {
                background: 'var(--ink2)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              },
              headerTitle: {
                color: 'var(--cream)',
                fontWeight: '600',
              },
              headerSubtitle: {
                color: 'var(--mist)',
              },
              socialButtonsBlockButtonText: {
                color: 'var(--cream)',
              },
              socialButtonsBlockButton: {
                background: 'var(--ink3)',
                border: '1px solid var(--border)',
              },
              formButtonPrimary: {
                background: 'var(--gold)',
                color: 'var(--ink)',
                fontWeight: '600',
              },
              formFieldLabel: {
                color: 'var(--mist)',
              },
              formFieldInput: {
                background: 'var(--ink3)',
                color: 'var(--cream)',
                borderColor: 'var(--border)',
              },
              footerActionText: {
                color: 'var(--mist)',
              },
              footerActionLink: {
                color: 'var(--gold)',
                fontWeight: '500',
              },
              dividerLine: {
                borderColor: 'var(--border)',
              },
              dividerText: {
                color: 'var(--mist)',
              },
              alert: {
                background: 'rgba(201, 168, 76, 0.1)',
                color: 'var(--gold)',
                border: '1px solid var(--border)',
              },
              navbar: {
                background: 'var(--ink2)',
                borderBottom: '1px solid var(--border)',
              },
              navbarMobile: {
                background: 'var(--ink2)',
                borderBottom: '1px solid var(--border)',
              },
              identityPreview: {
                background: 'var(--ink3)',
                color: 'var(--cream)',
                border: '1px solid var(--border)',
              },
              form: {
                background: 'transparent',
              },
              formField: {
                background: 'transparent',
              },
            },
          }}
          signInUrl="/sign-in"
        />

        {/* Tier Information */}
        <div style={{
          marginTop: '32px',
          padding: '24px',
          background: 'var(--ink2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--cream)',
            marginBottom: '16px',
            textAlign: 'center',
          }}>
            Choose Your Plan
          </h3>

          {/* FREE */}
          <div style={{
            padding: '16px',
            background: 'var(--ink)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--mist)',
              }}>Free</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 300,
                color: 'var(--cream)',
              }}>$0/mo</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--fog)', margin: 0 }}>
              Make predictions, track accuracy, browse markets
            </p>
          </div>

          {/* STANDARD */}
          <div style={{
            padding: '16px',
            background: 'var(--ink)',
            border: '1px solid var(--gold)',
            borderRadius: '4px',
            marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--gold)',
              }}>Standard</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 300,
                color: 'var(--cream)',
              }}>$9/mo</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--cream)', margin: 0 }}>
              <strong>Full reasoning access,</strong> filter by accuracy, follow experts
            </p>
          </div>

          {/* PRO */}
          <div style={{
            padding: '16px',
            background: 'var(--ink)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--mist)',
              }}>Pro</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 300,
                color: 'var(--cream)',
              }}>$29/mo</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--cream)', margin: 0 }}>
              <strong>Everything in Standard</strong> + expert Q&A, early access
            </p>
          </div>

          {/* Creator Income Note */}
          <div style={{
            padding: '12px',
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: '4px',
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--gold)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              margin: '0 0 6px 0',
            }}>
              Coming Soon: Creator Subscriptions
            </p>
            <p style={{ fontSize: '12px', color: 'var(--mist)', margin: '0 0 4px 0' }}>
              Proven forecasters can offer subscriptions and earn income from their expertise
            </p>
            <p style={{ fontSize: '11px', color: 'var(--gold)', margin: 0, fontWeight: 500 }}>
              Set your own price. Keep 85% of revenue.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
