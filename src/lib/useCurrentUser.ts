'use client'

import { useEffect, useState } from 'react'

interface CurrentUser {
  username: string | null
  displayName: string | null
  subscriptionTier: string | null
  isAdmin: boolean | null
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    username: null,
    displayName: null,
    subscriptionTier: null,
    isAdmin: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Always ask the server who this visitor is. Reviewer magic-link sessions
    // carry no Clerk userId but DO have a valid server session via the
    // msr_reviewer cookie — gating on Clerk's userId here made those sessions
    // invisible to every client component. Anonymous visitors just get a 401
    // and stay signed out, exactly as before.
    let cancelled = false
    fetch('/api/users/current')
      .then(res => {
        if (!res.ok) throw new Error('Not signed in')
        return res.json()
      })
      .then(data => {
        if (cancelled) return
        setCurrentUser({
          username: data.username,
          displayName: data.displayName,
          subscriptionTier: data.subscriptionTier,
          isAdmin: data.isAdmin,
        })
      })
      .catch(() => {
        /* anonymous visitor — currentUser stays null */
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { currentUser, loading }
}
