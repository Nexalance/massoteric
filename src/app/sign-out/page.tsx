'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignOutPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear ALL cookies (Clerk and any others)
    const cookies = document.cookie.split(';')

    cookies.forEach(cookie => {
      const cookieName = cookie.split('=')[0]?.trim()
      if (cookieName) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        // Also clear with domain
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`
      }
    })

    // Clear localStorage
    localStorage.clear()

    // Redirect to home after clearing
    setTimeout(() => {
      router.push('/')
    }, 500)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--ink)',
      color: 'var(--cream)',
    }}>
      <p>Signing out...</p>
    </div>
  )
}
