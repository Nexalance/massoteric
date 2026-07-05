// src/app/layout.tsx
// Root layout — wraps all pages with Clerk auth provider

import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Mono, Libre_Baskerville } from 'next/font/google'
import './globals.css'
import { ClerkAuthProvider } from '@/components/providers/ClerkAuthProvider'
import { MockAuthProvider } from '@/lib/useMockAuth'
import { Suspense } from 'react'
import Nav from '@/components/layout/Nav'
import NavWrapper from '@/components/layout/NavWrapper'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
})

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-body',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'Massoteric — Prediction Intelligence Platform',
    template: '%s | Massoteric',
  },
  description:
    'Expert forecasts with verified track records. See who\'s actually been right — on finance, politics, crypto, and more.',
  openGraph: {
    title: 'Massoteric',
    description: 'The world\'s most informed predictions.',
    type: 'website',
  },
}

// Check if we have valid Clerk keys
const hasValidClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder') &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('pk_test_placeholder')

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Use Clerk auth provider if keys are valid, otherwise use mock auth
  const AuthProvider = hasValidClerkKey ? ClerkAuthProvider : MockAuthProvider

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${libreBaskerville.variable} ${dmMono.variable}`}
    >
      <body>
        <AuthProvider>
          <Nav data-massoteric-nav />
          <NavWrapper />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
