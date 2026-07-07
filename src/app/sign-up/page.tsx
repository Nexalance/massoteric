'use client'

export const dynamic = 'force-dynamic'
import { SignUp } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

// Check if Clerk is properly configured (align with layout.tsx logic)
const hasValidClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder') &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('pk_test_placeholder')

export default function SignUpPage() {
  // If no valid Clerk keys, redirect to mock sign-up
  if (!hasValidClerkKey) {
    redirect('/sign-up/mock')
  }

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
        {/* Logo/Brand - with proper font */}
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
          path="/sign-up"
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
              // Additional elements for complete theming
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
      </div>
    </div>
  )
}
