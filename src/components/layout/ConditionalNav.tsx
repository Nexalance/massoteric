'use client'

import { usePathname } from 'next/navigation'
import Nav from './Nav'

// Paths where we don't want to show the main navbar (they have their own)
const EXCLUDED_PATHS = ['/']

export default function ConditionalNav({ initialUser, dataMassotericNav }: { initialUser?: { id: string; displayName: string; username: string | null; subscriptionTier: string | null; isAdmin: boolean } | null; dataMassotericNav?: string }) {
  const pathname = usePathname()
  const shouldShowNav = !EXCLUDED_PATHS.includes(pathname)

  if (!shouldShowNav) {
    return null
  }

  return <Nav initialUser={initialUser} dataMassotericNav={dataMassotericNav} />
}
