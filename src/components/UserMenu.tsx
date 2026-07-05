'use client'

import { UserButton } from '@clerk/nextjs'

export default function UserMenu() {
  return (
    <UserButton
      afterSignOutUrl="/"
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
