'use client'

import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'

const PENCIL_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={16}
    height={16}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
)

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
          menuButton: {
            color: '#f0ead6',
            '&:hover': {
              color: '#c9a84c',
              background: 'rgba(201, 168, 76, 0.1)',
            },
          },
          menuButtonIcon: {
            color: '#c9a84c',
          },
          userButtonPopoverCustomItemButton: {
            color: '#f0ead6',
            '&:hover': {
              color: '#c9a84c',
              background: 'rgba(201, 168, 76, 0.1)',
            },
          },
          userButtonPopoverCustomItemButtonIconBox: {
            color: '#c9a84c',
          },
        },
      }}
    >
      <UserButton.MenuItems>
        <UserButton.Link label="Edit Profile" labelIcon={PENCIL_ICON} href="/me" />
      </UserButton.MenuItems>
    </UserButton>
  )
}
