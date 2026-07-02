'use client'

import { useRouter } from 'next/navigation'
import { mockAuth } from '@/lib/mock-auth'

export default function MockSignUpPage() {
  const router = useRouter()

  const handleSignUp = () => {
    mockAuth.signIn()
    router.push('/onboarding')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0F14', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', letterSpacing: '0.2em', color: '#F5F0E8', lineHeight: '1.2' }}>
            MASS<span style={{ color: '#C9A84C' }}>OTERIC</span>
          </h1>
          <p style={{ color: '#8A909E', marginTop: '8px', fontSize: '14px', letterSpacing: '0.05em' }}>
            The Prediction Intelligence Platform
          </p>
        </div>

        {/* Sign Up Card */}
        <div style={{ background: '#151820', borderRadius: '8px', border: '1px solid #3A4055', overflow: 'hidden' }}>
          <div style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#F5F0E8', marginBottom: '8px' }}>
              Create Account
            </h2>
            <p style={{ color: '#8A909E', fontSize: '14px', marginBottom: '24px' }}>
              Start tracking your predictions today
            </p>

            {/* Features List */}
            <div style={{ background: '#0D0F14', borderRadius: '8px', padding: '16px', marginBottom: '24px', border: '1px solid #3A4055' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ color: '#C9A84C', fontSize: '16px' }}>✓</div>
                <p style={{ color: '#F5F0E8', fontSize: '14px' }}>Post predictions with reasoning</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ color: '#C9A84C', fontSize: '16px' }}>✓</div>
                <p style={{ color: '#F5F0E8', fontSize: '14px' }}>Build your verified track record</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ color: '#C9A84C', fontSize: '16px' }}>✓</div>
                <p style={{ color: '#F5F0E8', fontSize: '14px' }}>Climb the leaderboards</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#C9A84C', fontSize: '16px' }}>✓</div>
                <p style={{ color: '#F5F0E8', fontSize: '14px' }}>Monetize your expertise</p>
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              onClick={handleSignUp}
              style={{ width: '100%', background: '#C9A84C', color: '#0D0F14', fontWeight: '600', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#E8C96A'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#C9A84C'}
            >
              Get Started
            </button>

            {/* Dev Notice */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #3A4055' }}>
              <p style={{ color: '#8A909E', fontSize: '12px', textAlign: 'center' }}>
                ⚡ Development mode — Skips verification
              </p>
            </div>
          </div>

          {/* Sign In Link */}
          <div style={{ padding: '16px 32px', background: '#1E2230', borderTop: '1px solid #3A4055' }}>
            <p style={{ textAlign: 'center', color: '#8A909E', fontSize: '14px' }}>
              Already have an account?{' '}
              <a href="/sign-in" style={{ color: '#C9A84C', fontWeight: '500', textDecoration: 'none' }}>
                Sign in
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p style={{ color: '#8A909E', fontSize: '12px' }}>
            Powered by Clerk Authentication
          </p>
        </div>
      </div>
    </div>
  )
}
