// src/app/layout.tsx
// Root layout — wraps all pages with Clerk auth provider

import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Mono, Libre_Baskerville } from 'next/font/google'
import './globals.css'
import { MockAuthProvider } from '@/lib/useMockAuth'

// Only import ClerkProvider if we have valid keys
const hasValidClerkKey = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder')
let ClerkProvider: any

if (hasValidClerkKey) {
  const clerk = require('@clerk/nextjs')
  ClerkProvider = clerk.ClerkProvider
}

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

function DevWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MockAuthProvider>
      <html
        lang="en"
        className={`${cormorant.variable} ${libreBaskerville.variable} ${dmMono.variable}`}
      >
        <body>{children}</body>
      </html>
    </MockAuthProvider>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // In development without Clerk keys, skip ClerkProvider
  if (!hasValidClerkKey) {
    return <DevWrapper>{children}</DevWrapper>
  }

  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${cormorant.variable} ${libreBaskerville.variable} ${dmMono.variable}`}
      >
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
