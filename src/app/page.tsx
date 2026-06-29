// src/app/page.tsx
// Landing page — Massoteric home

import Link from 'next/link'

export const metadata = {
  title: 'Massoteric — Prediction Intelligence Platform',
  description: 'Expert forecasts with verified track records. See who\'s actually been right.',
}

export default function LandingPage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'linear-gradient(180deg, var(--ink) 0%, var(--ink3) 100%)',
    }}>
      <div style={{ maxWidth: '600px', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '48px',
          fontWeight: 700,
          color: 'var(--cream)',
          marginBottom: '20px',
          letterSpacing: '-1px',
        }}>
          Massoteric
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '20px',
          color: 'var(--mist)',
          marginBottom: '16px',
          lineHeight: '1.6',
        }}>
          The Prediction Intelligence Platform
        </p>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '16px',
          color: 'var(--fog)',
          marginBottom: '40px',
          lineHeight: '1.6',
        }}>
          Expert forecasts with verified track records. See who's actually been right — on finance, politics, crypto, and more.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/feed"
            style={{
              padding: '14px 32px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              background: 'var(--gold)',
              color: 'var(--ink)',
              border: 'none',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.2s',
              display: 'inline-block',
            }}
          >
            Explore Markets
          </Link>

          <Link
            href="/leaderboard"
            style={{
              padding: '14px 32px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              background: 'transparent',
              color: 'var(--cream)',
              border: '1px solid var(--fog)',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.2s',
              display: 'inline-block',
            }}
          >
            View Leaderboard
          </Link>
        </div>

        <div style={{
          marginTop: '48px',
          padding: '16px',
          background: 'rgba(201,168,76,0.1)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: '4px',
        }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--gold)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            Development Mode
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: 'var(--mist)',
          }}>
            Running with mock authentication. Add Clerk API keys to .env.local for full functionality.
          </p>
        </div>
      </div>
    </main>
  )
}
