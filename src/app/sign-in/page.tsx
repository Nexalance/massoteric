'use client'

export const dynamic = 'force-dynamic'
import { SignIn } from '@clerk/nextjs'
import { redirect, useSearchParams } from 'next/navigation'

// Check if Clerk is properly configured (align with layout.tsx logic)
const hasValidClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder') &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('pk_test_placeholder')

export default function SignInPage() {
  // If no valid Clerk keys, redirect to mock sign-in
  if (!hasValidClerkKey) {
    redirect('/sign-in/mock')
  }

  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/feed'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0F14] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-widest uppercase text-[#F5F0E8]">
            Mass<span className="text-[#C9A84C]">oteric</span>
          </h1>
          <p className="text-[#8A909E] mt-2 text-sm">Prediction Intelligence Platform</p>
        </div>

        <SignIn
          routing="hash"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: {
                background: '#151820',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
              },
              headerTitle: {
                color: '#F5F0E8',
                fontWeight: '600',
              },
              headerSubtitle: {
                color: '#8A909E',
              },
              socialButtonsBlockButtonText: {
                color: '#F5F0E8',
              },
              socialButtonsBlockButton: {
                background: '#1E2230',
                border: '1px solid #3A4055',
              },
              formButtonPrimary: {
                background: '#C9A84C',
                color: '#0D0F14',
                fontWeight: '600',
              },
              formFieldLabel: {
                color: '#8A909E',
              },
              formFieldInput: {
                background: '#1E2230',
                color: '#F5F0E8',
                borderColor: '#3A4055',
              },
              footerActionText: {
                color: '#8A909E',
              },
              footerActionLink: {
                color: '#C9A84C',
                fontWeight: '500',
              },
            },
          }}
          afterSignUpUrl="/onboarding"
          redirectUrl={redirectUrl}
        />
      </div>
    </div>
  )
}
