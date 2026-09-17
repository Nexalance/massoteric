'use client'

import { useEffect, useState } from 'react'

interface CurrentUser {
  id: string | null
  username: string | null
  displayName: string | null
  subscriptionTier: string | null
  isAdmin: boolean | null
}

const NULL_USER: CurrentUser = {
  id: null,
  username: null,
  displayName: null,
  subscriptionTier: null,
  isAdmin: null,
}

export function useCurrentUser(initial?: { id: string; displayName: string; username: string | null; subscriptionTier: string | null; isAdmin: boolean } | null, refetchKey?: boolean) {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(
    initial
      ? {
          id: initial.id,
          username: initial.username,
          displayName: initial.displayName,
          subscriptionTier: initial.subscriptionTier,
          isAdmin: initial.isAdmin,
        }
      : NULL_USER
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Always ask the server who this visitor is. Reviewer magic-link sessions
    // carry no Clerk userId but DO have a valid server session via the
    // msr_reviewer cookie — gating on Clerk's userId here made those sessions
    // invisible to every client component. Anonymous visitors just get a 401
    // and stay signed out, exactly as before.
    let cancelled = false
    fetch('/api/users/current', { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('Not signed in')
        return res.json()
      })
      .then(data => {
        if (cancelled) return
        setCurrentUser({
          id: data.id,
          username: data.username,
          displayName: data.displayName,
          subscriptionTier: data.subscriptionTier,
          isAdmin: data.isAdmin,
        })
      })
      .catch(() => {
        /* anonymous or signed-out — clear so the nav flips back correctly */
        if (!cancelled) setCurrentUser(NULL_USER)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refetchKey])

  return { currentUser, loading }
}
