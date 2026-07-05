'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'

interface CurrentUser {
  username: string | null
  displayName: string | null
  subscriptionTier: string | null
  isAdmin: boolean | null
}

export function useCurrentUser() {
  const { userId, isLoaded } = useAuth()
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    username: null,
    displayName: null,
    subscriptionTier: null,
    isAdmin: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !isLoaded) {
      setLoading(false)
      return
    }

    // Fetch current user from database
    fetch('/api/users/current')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user')
        return res.json()
      })
      .then(data => {
        setCurrentUser({
          username: data.username,
          displayName: data.displayName,
          subscriptionTier: data.subscriptionTier,
          isAdmin: data.isAdmin,
        })
      })
      .catch(err => {
        console.error('Error fetching current user:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [userId, isLoaded])

  return { currentUser, loading }
}
