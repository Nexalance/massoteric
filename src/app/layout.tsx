// src/app/layout.tsx
// Root layout — wraps all pages with Clerk auth provider

import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Cormorant_Garamond, DM_Mono, Libre_Baskerville } from 'next/font/google'
import './globals.css'

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
