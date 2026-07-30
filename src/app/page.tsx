// src/app/page.tsx
// Landing page server component — auth-aware routing

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-mock'
import { prisma } from '@/lib/prisma'
import LandingPageContent from './LandingPageContent'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await auth()

  // If user is authenticated, redirect to feed immediately
  // (Landing page is for first-time/anonymous visitors only)
  if (user?.userId) {
    redirect('/feed')
  }

  // Show landing page to anonymous visitors
  return <LandingPageContent />
}
