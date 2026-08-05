'use client'

import { useEffect, useState } from 'react'
import { ReactNode } from 'react'

export function ClientBoundary({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // During SSR/hydration, render children with hydration warning suppressed
  // This allows the nav to show immediately while avoiding hydration mismatch errors
  if (!isClient) {
    return <div suppressHydrationWarning>{children}</div>
  }

  return <>{children}</>
}
