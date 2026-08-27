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
            background: '#1a1a2e',
            border: '1px solid var(--border)',
            color: '#f0ead6',
          },
          userButtonPopoverMainArea: {
            background: '#1a1a2e',
            color: '#f0ead6',
          },
          userButtonPopoverActionButton: {
            color: '#f0ead6',
            '&:hover': {
              color: '#c9a84c',
              background: 'rgba(201, 168, 76, 0.1)',
            },
          },
          userButtonPopoverActionIconBox: {
            background: 'transparent',
            color: '#f0ead6',
            '& svg': {
              stroke: '#f0ead6',
            },
          },
        },
      }}
    />
  )
}
