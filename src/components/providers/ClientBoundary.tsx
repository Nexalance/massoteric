'use client'

import { useEffect, useState } from 'react'
import { ReactNode } from 'react'

export function ClientBoundary({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Render a minimal placeholder during hydration
  if (!isClient) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ink)' }} suppressHydrationWarning>
        <div style={{ height: 60, background: 'rgba(13,15,20,0.97)', borderBottom: '1px solid var(--border)' }} />
      </div>
    )
  }

  return <>{children}</>
}
