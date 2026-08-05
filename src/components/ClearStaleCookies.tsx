'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'

// Flag to ensure we only clear cookies once per session
const CLEARED_COOKIES_KEY = 'massoteric_cleared_stale_cookies'

export default function ClearStaleCookies({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  const hasClearedRef = useRef(false)

  useEffect(() => {
    // Skip if we already cleared in this session
    if (typeof window !== 'undefined' && sessionStorage.getItem(CLEARED_COOKIES_KEY)) {
      return
    }

    // Wait for Clerk to initialize (2 second timeout)
    const timeoutId = setTimeout(() => {
      // Only clear cookies if:
      // 1. Clerk failed to load (isLoaded is still false after timeout)
      // 2. AND there are Clerk cookies present (indicating stale data)
      if (!isLoaded && !hasClearedRef.current) {
        const clerkCookies = ['__session', '__clerk_session_jwt', '__clerk_abacus']
        const hasStaleCookies = clerkCookies.some(cookieName =>
          document.cookie.split('; ').some(row => row.startsWith(`${cookieName}=`))
        )

        if (hasStaleCookies) {
          console.log('Clearing stale Clerk cookies (auth failed to load)')
          clerkCookies.forEach(cookieName => {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          })
          hasClearedRef.current = true
          // Mark that we've cleared - won't clear again this session
          sessionStorage.setItem(CLEARED_COOKIES_KEY, 'true')
        }
      }
    }, 2000)

    // If Clerk loads successfully and user is signed in, cookies are valid
    if (isLoaded && isSignedIn) {
      clearTimeout(timeoutId)
    }

    return () => clearTimeout(timeoutId)
  }, [isLoaded, isSignedIn])

  return <>{children}</>
}
