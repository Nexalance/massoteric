'use client'

import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'

export default function UserButtonWrapper({ afterSignOutUrl }: { afterSignOutUrl?: string }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Only render UserButton after component is mounted on client
  if (!isMounted) {
    return null
  }

  return (
    <UserButton
      afterSignOutUrl={afterSignOutUrl}
      appearance={{
        elements: {
          userButtonTrigger: {
            fontWeight: '500',
            fontSize: '14px',
            padding: '8px 16px',
          },
          userButtonPopoverCard: {
            background: 'var(--ink2)',
            border: '1px solid var(--border)',
          },
          userButtonPopoverActionButton: {
            color: 'var(--cream)',
          },
        },
      }}
    />
  )
}
