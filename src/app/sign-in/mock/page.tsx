'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { mockAuth } from '@/lib/mock-auth'

export default function MockSignInPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = mockAuth.getUser()
    if (user) {
      router.push('/feed')
      return
    }
    setLoading(false)
  }, [router])

  const handleSignIn = () => {
    mockAuth.signIn()
    router.push('/feed')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0F14' }}>
        <div style={{ color: '#8A909E' }}>Loading...</div>
      </div>
    )
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

        {/* Sign In Card */}
        <div style={{ background: '#151820', borderRadius: '8px', border: '1px solid #3A4055', overflow: 'hidden' }}>
          <div style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#F5F0E8', marginBottom: '8px' }}>
              Sign In
            </h2>
            <p style={{ color: '#8A909E', fontSize: '14px', marginBottom: '24px' }}>
              Mock authentication for local development
            </p>

            {/* Mock User Preview */}
            <div style={{ background: '#0D0F14', borderRadius: '8px', padding: '16px', marginBottom: '24px', border: '1px solid #3A4055' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D0F14', fontWeight: 'bold', fontSize: '18px' }}>
                  M
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#F5F0E8', fontWeight: '500', marginBottom: '4px' }}>Mock User</p>
                  <p style={{ color: '#8A909E', fontSize: '14px' }}>mock@massoteric.dev</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#C9A84C', fontSize: '12px', fontWeight: '600', padding: '4px 8px', background: 'rgba(201, 168, 76, 0.1)', borderRadius: '4px', display: 'inline-block' }}>
                    PRO
                  </p>
                </div>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleSignIn}
              style={{ width: '100%', background: '#C9A84C', color: '#0D0F14', fontWeight: '600', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#E8C96A'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#C9A84C'}
            >
              Sign In
            </button>

            {/* Dev Notice */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #3A4055' }}>
              <p style={{ color: '#8A909E', fontSize: '12px', textAlign: 'center' }}>
                ⚡ Development mode — No real authentication required
              </p>
            </div>
          </div>

          {/* Sign Up Link */}
          <div style={{ padding: '16px 32px', background: '#1E2230', borderTop: '1px solid #3A4055' }}>
            <p style={{ textAlign: 'center', color: '#8A909E', fontSize: '14px' }}>
              Don&apos;t have an account?{' '}
              <a href="/sign-up" style={{ color: '#C9A84C', fontWeight: '500', textDecoration: 'none' }}>
                Sign up
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
