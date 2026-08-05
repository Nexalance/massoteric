'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'

export default function ClearStaleCookies({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAuth()

  useEffect(() => {
    // Clear stale Clerk cookies on first load
    // This fixes issues from Clerk key rotation
    const clerkCookies = ['__session', '__clerk_session_jwt', '__clerk_abacus']

    clerkCookies.forEach(cookieName => {
      const cookie = document.cookie.split('; ').find(row => row.startsWith(`${cookieName}=`))
      if (cookie) {
        // Clear the cookie
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      }
    })
  }, [])

  return <>{children}</>
}
