export const dynamic = 'force-dynamic'
import { SignUp } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

// Check if Clerk is properly configured
const hasValidClerkKey = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder')

export default function SignUpPage() {
  // If no valid Clerk keys, redirect to mock sign-up
  if (!hasValidClerkKey) {
    redirect('/sign-up/mock')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0F14]">
      <div className="w-full max-w-md">
        <SignUp
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
          redirectUrl="/onboarding"
          afterSignInUrl="/feed"
          afterSignUpUrl="/onboarding"
        />
      </div>
    </div>
  )
}
